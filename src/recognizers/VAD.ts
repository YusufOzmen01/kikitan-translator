import { Recognizer } from "./recognizer";
import { invoke } from "@tauri-apps/api/core";
import { setupMicrophoneCapture, setupSystemAudioCapture } from "../util/audiocapture";
import { Config, get_language, load_config } from "../util/config";
import google_translate from "../translators/google_translate";
import edge_translate from "../translators/edge_translate";
import groq_translate from "../translators/groq_translate";
import { FrameProcessor, Message } from "@ricky0123/vad-web";
import { Resampler } from "@ricky0123/vad-web/dist/resampler";
import { SileroV5 } from "@ricky0123/vad-web/dist/models/v5";
import * as ort from "onnxruntime-web";
import { error, info } from "@tauri-apps/plugin-log";
import { localization } from "../util/localization";

const translators = [google_translate, edge_translate, groq_translate];

const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const VAD_SAMPLE_RATE = 16000;
const FRAME_SAMPLES = 512;
const CDN_BASE = "https://cdn.jsdelivr.net/npm";

ort.env.wasm.wasmPaths = `${CDN_BASE}/onnxruntime-web@1.14.0/dist/`;

export type VADOptions = {
    desktop_capture
    ?: boolean;
    noTranslate?: boolean;
    positiveSpeechThreshold?: number;
    negativeSpeechThreshold?: number;
    redemptionFrames?: number;
    minSpeechFrames?: number;
    preSpeechPadFrames?: number;
};

export type VADState = {
    running: boolean;
    speaking: boolean;
};

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const numSamples = samples.length;
    const dataBytes = numSamples * (BITS_PER_SAMPLE / 8);
    const buffer = new ArrayBuffer(44 + dataBytes);
    const view = new DataView(buffer);

    const byteRate = sampleRate * CHANNELS * (BITS_PER_SAMPLE / 8);
    const blockAlign = CHANNELS * (BITS_PER_SAMPLE / 8);

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataBytes, true);
    writeString(view, 8, "WAVE");

    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, CHANNELS, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, BITS_PER_SAMPLE, true);

    writeString(view, 36, "data");
    view.setUint32(40, dataBytes, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        const sample = Math.max(-1, Math.min(1, samples[i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, int16, true);
        offset += 2;
    }

    return buffer;
}

function writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

export class VAD extends Recognizer {
    speaking = false;
    desktop_capture: boolean;
    no_translate: boolean;

    positiveSpeechThreshold: number = 0.25;
    negativeSpeechThreshold: number = 0.10;
    redemptionFrames: number = 24;
    minSpeechFrames: number = 2;
    preSpeechPadFrames: number = 5;

    stopCapture: (() => Promise<void>) | null = null;
    onSpeechCallback: ((wav: ArrayBuffer, sampleRate: number) => void) | null = null;
    callback: ((result: string[], final: boolean) => void) | null = null;
    setSRLoading: ((loading: boolean) => void) | null = null;
    showNotification: ((message: string, severity: "success" | "error" | "warning" | "info") => void) | null = null;
    setConfig: ((config: Config) => void) | null = null;

    frameProcessor: FrameProcessor | null = null;
    resampler: Resampler | null = null;
    frameQueue: Float32Array[] = [];
    processingFrame = false;

    constructor(language_src: string, language_target: string, desktop_capture = false, no_translate = false, setSRLoading: ((loading: boolean) => void) | null = null, showNotification: ((message: string, severity: "success" | "error" | "warning" | "info") => void) | null = null, setConfig: ((config: Config) => void) | null = null) {
        super(language_src, language_target);

        this.desktop_capture = desktop_capture;
        this.no_translate = no_translate;
        this.setSRLoading = setSRLoading;
        this.showNotification = showNotification;
        this.setConfig = setConfig;
    }

    onSpeech(callback: (wav: ArrayBuffer, sampleRate: number) => void) {
        this.onSpeechCallback = callback;
    }

    name(): string {
        return "VAD";
    }

    onResult(callback: (result: string[], final: boolean) => void): void {
        this.callback = callback;
    }

    async manual_trigger(data: string) {
        const result = [data, ""];
        const config = load_config();

        try {
            const val = await translators[config.translator_settings.translation_service](data, this.language_src, this.language_target, this.showNotification, this.setConfig);
            
            result[1] = val
        } catch (e) {
            error(`[EDGE-STT] Error translating using ${config.translator_settings.translation_service}: ${e}`);
        }

        this.callback?.(result, true);
    }

    async start() {
        if (this.running) return;
        this.running = true;
        this.speaking = false;
        this.frameQueue = [];
        this.processingFrame = false;

        this.setSRLoading?.(true);

        const config = load_config();

        const modelURL = `${CDN_BASE}/@ricky0123/vad-web@0.0.22/dist/silero_vad_v5.onnx`;
        const model = await SileroV5.new(ort, async () => {
            const resp = await fetch(modelURL);
            return await resp.arrayBuffer();
        });

        this.frameProcessor = new FrameProcessor(
            model.process.bind(model),
            model.reset_state.bind(model),
            {
                positiveSpeechThreshold: this.positiveSpeechThreshold,
                negativeSpeechThreshold: this.negativeSpeechThreshold,
                redemptionFrames: this.redemptionFrames,
                minSpeechFrames: this.minSpeechFrames,
                preSpeechPadFrames: this.preSpeechPadFrames,
                frameSamples: FRAME_SAMPLES,
                submitUserSpeechOnPause: false,
            },
        );
        this.frameProcessor.resume();

        let nativeSampleRate = 48000;
        if (!this.desktop_capture) {
            const mics = await invoke("get_microphone_list") as { name: string; sample_rate: number }[];
            nativeSampleRate = mics.filter((m) => m.name === config.microphone)[0]?.sample_rate || 48000;
        }

        this.resampler = new Resampler({
            nativeSampleRate,
            targetSampleRate: VAD_SAMPLE_RATE,
            targetFrameSize: FRAME_SAMPLES,
        });

        const captureCallback = (chunk: Float32Array) => {
            if (!this.running || !this.resampler || !this.frameProcessor) return;

            const frames = this.resampler.process(chunk);
            for (const frame of frames) {
                this.processFrame(frame);
            }
        };

        if (this.desktop_capture) {
            this.stopCapture = await setupSystemAudioCapture(captureCallback);

             (async () => {
                const res: boolean = await invoke("is_desktop_overlay_running");
                if (res) info("[OVERLAY] Overlay is already running!");
                else {
                    try {
                        info("[OVERLAY] Starting desktop overlay...", );

                        await invoke("start_desktop_overlay");
                        await new Promise((resolve) =>
                            setTimeout(resolve, 2000),
                        );
                    } catch (error) {
                        info(
                            `[OVERLAY] Failed to start desktop overlay: ${error}`,
                        );
                        info(
                            "[OVERLAY] Desktop overlay functionality will be disabled.",
                        );
                    }
                }
            })();
        } else {
            this.stopCapture = await setupMicrophoneCapture(captureCallback, config.microphone);
        }

        this.setSRLoading?.(false);
        info("[VAD] Started with Silero V5");
    }

    stop() {
        if (!this.running) return;
        this.running = false;

        if (this.frameProcessor) {
            const result = this.frameProcessor.endSegment();
            if (result.msg === Message.SpeechEnd && result.audio) {
                this.handleSpeechEnd(result.audio);
            }
        }

        this.speaking = false;
        this.frameQueue = [];
        this.processingFrame = false;
        this.frameProcessor = null;
        this.resampler = null;

        if (this.stopCapture) {
            this.stopCapture().then(() => {
                info("[VAD] Audio capture stopped");
            });
            this.stopCapture = null;
        }

        info("[VAD] Stopped");
    }

    status(): VADState {
        return { running: this.running, speaking: this.speaking };
    }

    processFrame(frame: Float32Array) {
        if (!this.frameProcessor) return;

        this.frameQueue.push(frame);
        if (!this.processingFrame) {
            this.drainQueue();
        }
    }

    private async drainQueue() {
        if (this.processingFrame) return;
        this.processingFrame = true;

        while (this.frameQueue.length > 0 && this.frameProcessor) {
            const frame = this.frameQueue.shift()!;
            try {
                const result = await this.frameProcessor.process(frame);
                if (result.msg === Message.SpeechStart) {
                    this.speaking = true;
                    console.log("[VAD] Speech started");
                } else if (result.msg === Message.SpeechEnd && result.audio) {
                    this.speaking = false;
                    console.log("[VAD] Speech ended");
                    this.handleSpeechEnd(result.audio);
                } else if (result.msg === Message.VADMisfire) {
                    this.speaking = false;
                    console.log("[VAD] VAD misfire (too short)");
                }
            } catch (e) {
                console.error("[VAD] Frame processing error:", e);
            }
        }

        this.processingFrame = false;
    }

    handleSpeechEnd(audio: Float32Array) {
        const wav = encodeWav(audio, VAD_SAMPLE_RATE);
        this.onSpeechCallback?.(wav, VAD_SAMPLE_RATE);
        this.transcribeAndTranslate(wav);
    }

    async transcribeAndTranslate(wav: ArrayBuffer) {
        try {
            const config = load_config();
            const apiKey = config.groq.api_key;
            if (!apiKey) {
                error("[VAD] No Groq API key configured");

                this.showNotification?.(localization.no_api_key_configured_for_groq[get_language()], "error");

                return;
            }

            const blob = new Blob([wav], { type: "audio/wav" });
            const formData = new FormData();
            formData.append("file", blob, "audio.wav");
            formData.append("model", "whisper-large-v3");
            formData.append("temperature", "0");
            formData.append("response_format", "verbose_json");
            formData.append("language", this.language_src.split("-")[0]);

            const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errText = await response.text();
                error(`[VAD] Whisper API error ${response.status}: ${errText}`);

                if (response.status === 401) {
                    this.showNotification?.(localization.invalid_api_key_groq[get_language()], "error");
                } else {
                    this.showNotification?.(`[VAD] Whisper API error ${response.status}: ${errText}`, "error");
                }
                return;
            }

            const data = await response.json();
            const transcript = (data.text ?? "").trim();

            if (!transcript) return;

            const result = [transcript, ""];
            this.callback?.(result, false);

            if (!this.no_translate) {
                try {
                    const val = await translators[config.translator_settings.translation_service](transcript, this.language_src, this.language_target, this.showNotification, this.setConfig);
                    
                    result[1] = val
                } catch (e) {
                    error(`[EDGE-STT] Error translating using ${config.translator_settings.translation_service}: ${e}`);
                }
            }

            this.callback?.(result, true);
        } catch (e) {
            error(`[VAD] Error in transcribe/translate: ${e}`);

            this.showNotification?.(`[VAD] Error in transcribe/translate: ${e}`, "error");
        }
    }
}
