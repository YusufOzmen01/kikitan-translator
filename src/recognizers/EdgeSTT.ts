import { Recognizer } from "./recognizer";
import { error, info, error as logError } from "@tauri-apps/plugin-log";
import { setupMicrophoneCapture, setupSystemAudioCapture } from "../util/audiocapture";
import google_translate from "../translators/google_translate";
import { invoke } from "@tauri-apps/api/core";
import { load_config } from "../util/config";
import edge_translate from "../translators/edge_translate";

const TRUSTED_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const MS_VERSION = "1-145.0.3800.70";
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

export type EdgeSTTState = {
    connection_init_time: number;
    connection_established_time: number;
    connected: boolean;
    error: boolean;
    error_message?: string;
};

export type ResultCallback = ((result: string[], final: boolean) => void) | null;

async function generateSecMsGecAsync(): Promise<string> {
    const EPOCH = 11644473600n;
    const now = BigInt(Math.floor(Date.now() / 1000));
    const ticks = (now + EPOCH) * 10_000_000n;
    const rounded = ticks - (ticks % 300_000_000n);

    const encoder = new TextEncoder();
    const data = encoder.encode(`${rounded}${TRUSTED_TOKEN}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function getTimestamp(): string {
    return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function createTextMessage(
    path: string,
    bodyDict: Record<string, unknown>,
    contentType?: string,
    requestId?: string,
): string {
    const headers: string[] = [
        `X-Timestamp:${getTimestamp()}`,
        `Path:${path}`,
    ];
    if (requestId) headers.push(`X-RequestId:${requestId}`);
    if (contentType) headers.push(`Content-Type:${contentType}`);

    const headerStr = headers.join("\r\n");
    const bodyStr = JSON.stringify(bodyDict);
    return `${headerStr}\r\n\r\n${bodyStr}`;
}

function createBinaryMessage(
    path: string,
    streamId: string | null,
    requestId: string,
    binaryData: Uint8Array,
    contentType?: string,
): ArrayBuffer {
    const headers: string[] = [
        `X-Timestamp:${getTimestamp()}`,
        `Path:${path}`,
        `X-RequestId:${requestId}`,
    ];
    if (contentType) headers.push(`Content-Type:${contentType}`);
    if (streamId) headers.push(`X-StreamId:${streamId}`);

    const headerStr = headers.join("\r\n");
    const encoder = new TextEncoder();
    const headerBytes = encoder.encode(headerStr);
    const headerLen = headerBytes.length;

    const result = new ArrayBuffer(2 + headerLen + binaryData.length);
    const view = new DataView(result);
    view.setUint16(0, headerLen, false);
    const resultArray = new Uint8Array(result);
    resultArray.set(headerBytes, 2);
    resultArray.set(binaryData, 2 + headerLen);

    return result;
}

function createWavHeader(SAMPLE_RATE: number): Uint8Array {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    const audioFormat = 1;
    const byteRate = SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8);
    const blockAlign = CHANNELS * (BITS_PER_SAMPLE / 8);

    writeString(view, 0, "RIFF");
    view.setUint32(4, 0, true);
    writeString(view, 8, "WAVE");

    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, audioFormat, true);
    view.setUint16(22, CHANNELS, true);
    view.setUint32(24, SAMPLE_RATE, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, BITS_PER_SAMPLE, true);

    writeString(view, 36, "data");
    view.setUint32(40, 0, true);

    return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

function generateUuid(): string {
    return crypto.randomUUID().replace(/-/g, "");
}

export class EdgeSTT extends Recognizer {
    callback: ResultCallback = null;
    desktop_capture: boolean = false;
    no_translate: boolean = false;

    ws: WebSocket | null = null;
    connectionId: string = "";
    currentRequestId: string = "";
    streamIdCounter: number = 1;
    currentServiceTag: string | null = null;
    audioStreamActive: boolean = false;
    restartPending: boolean = false;
    useEdgeTranslate: boolean = false;

    bytesSent: number = 0;
    sample_rate: number = 48000;
    mic: string = "default";

    worker_callback: (() => Promise<void>) | null = null;

    current_status: EdgeSTTState = {
        connected: false,
        error: false,
        connection_established_time: 0,
        connection_init_time: 0,
    };

    constructor(
        language_src: string,
        language_target: string,
        desktop_capture: boolean = false,
        no_translate: boolean = false,
    ) {
        super(language_src, language_target);
        this.desktop_capture = desktop_capture;
        this.no_translate = no_translate;
    }

    start() {
        this.running = true;
        this.initConnection();
    }

    async initConnection() {
        if (!this.running) return;

        await this.cleanup();

        this.connectionId = generateUuid();
        this.currentRequestId = generateUuid();
        this.streamIdCounter = 1;
        this.currentServiceTag = null;
        this.restartPending = false;
        this.bytesSent = 0;

        this.current_status.connection_init_time = Date.now();

        const config = load_config();

        this.useEdgeTranslate = config.use_edge_translate;

        const mics = await invoke("get_microphone_list") as { name: string; sample_rate: number }[];
        this.sample_rate = mics.filter((mic) => mic.name === config.microphone)[0]?.sample_rate || 48000;
        this.mic = config.microphone;

        info(`[EDGE-STT] Current microphone: ${config.microphone} Sample Rate: ${this.sample_rate}Hz`);

        try {
            const gec = await generateSecMsGecAsync();
            const url = `wss://speech.platform.bing.com/speech/recognition/edge/interactive/v1?TrustedClientToken=${TRUSTED_TOKEN}&Sec-MS-GEC=${gec}&Sec-MS-GEC-Version=${MS_VERSION}&language=${this.language_src}&profanity=raw`;

            info(`[EDGE-STT] Connecting to: ${url}`);

            this.ws = new WebSocket(url);
            this.ws.binaryType = "arraybuffer";

            this.ws.onopen = () => this.onOpen();
            this.ws.onmessage = (ev) => this.onMessage(ev);
            this.ws.onerror = (ev) => this.onError(ev);
            this.ws.onclose = (ev) => this.onClose(ev);
        } catch (e) {
            logError(`[EDGE-STT] Failed to init connection: ${e}`);
            this.current_status.error = true;
            this.current_status.error_message = String(e);
        }
    }

    onOpen() {
        this.current_status.connected = true;
        this.current_status.connection_established_time = Date.now();
        this.current_status.error = false;

        info(`[EDGE-STT${this.desktop_capture ? " DESKTOP" : ""}] Connected!`);

        this.wsSendText(
            createTextMessage(
                "speech.config",
                {
                    context: {
                        audio: {
                            source: {
                                bitspersample: String(BITS_PER_SAMPLE),
                                channelcount: String(CHANNELS),
                                model: "",
                                samplerate: String(this.sample_rate),
                                type: "Stream",
                            },
                        },
                        os: { name: "Client", platform: "Windows", version: "10" },
                        system: { build: "Windows-x64", name: "SpeechSDK", version: "1.15.0" },
                    },
                },
                "application/json",
            ),
        );

        this.wsSendText(
            createTextMessage(
                "speech.context",
                { audio: { streams: { "1": null } } },
                undefined,
                this.currentRequestId,
            ),
        );

        this.sendWavHeader();
        this.startAudioCapture();
    }

    async onMessage(ev: MessageEvent) {
        let msgStr: string;

        if (typeof ev.data === "string") {
            msgStr = ev.data;
        } else if (ev.data instanceof ArrayBuffer) {
            const view = new DataView(ev.data);
            if (ev.data.byteLength < 2) return;
            
            const headerLen = view.getUint16(0, false);
            const decoder = new TextDecoder("utf-8");
            const headerBytes = new Uint8Array(ev.data, 2, headerLen);
            msgStr = decoder.decode(headerBytes);
            if (ev.data.byteLength > 2 + headerLen) {
                const bodyBytes = new Uint8Array(ev.data, 2 + headerLen);
                try {
                    msgStr += "\r\n\r\n" + decoder.decode(bodyBytes);
                } catch {
                    // ignore
                }
            }
        } else {
            return;
        }

        if (msgStr.includes("Path:turn.start")) {
            try {
                const jsonPart = msgStr.split("\r\n\r\n")[1];
                if (jsonPart) {
                    const data = JSON.parse(jsonPart);
                    if (data?.context?.serviceTag) {
                        this.currentServiceTag = data.context.serviceTag;
                        
                        // info(`[EDGE-STT] Captured Service Tag: ${this.currentServiceTag}`);
                    }
                }
            } catch (e) {
                logError(`[EDGE-STT] Error parsing turn.start: ${e}`);
            }
        }

        if (msgStr.includes("Path:speech.hypothesis")) {
            try {
                const jsonPart = msgStr.split("\r\n\r\n")[1];
                if (jsonPart) {
                    const parsed = JSON.parse(jsonPart);
                    if (parsed.Text) {
                        this.callback?.([parsed.Text, ""], false);
                    }
                }
            } catch (e) {
                logError(`[EDGE-STT] Error parsing speech.hypothesis: ${e}`);
            }
        }

        if (msgStr.includes("Path:speech.phrase")) {
            try {
                const jsonPart = msgStr.split("\r\n\r\n")[1];
                if (jsonPart) {
                    const parsed = JSON.parse(jsonPart);
                    if (parsed.DisplayText) {
                        const response = [parsed.DisplayText, ""];

                        if (!this.no_translate) {
                            if (this.useEdgeTranslate) {
                                response[1] = await edge_translate(parsed.DisplayText, this.language_src, this.language_target);
                            } else {
                                response[1] = await google_translate(parsed.DisplayText, this.language_src, this.language_target);
                            }
                        }

                        this.callback?.(response, true);
                    }
                }
            } catch (e) {
                logError(`[EDGE-STT] Error parsing speech.phrase: ${e}`);
            }
        }

        if (msgStr.includes("Path:turn.end")) {
            this.handleTurnRestart();
        }
    }

    onError(ev: Event) {
        logError(`[EDGE-STT${this.desktop_capture ? " DESKTOP" : ""}] WebSocket error: ${ev}`);
        this.current_status.connected = false;
        this.current_status.error = true;
        this.current_status.error_message = "WebSocket error";
    }

    onClose(ev: CloseEvent) {
        info(
            `[EDGE-STT${this.desktop_capture ? " DESKTOP" : ""}] Connection closed: ${ev.code} ${ev.reason}`,
        );
        this.current_status.connected = false;
        this.audioStreamActive = false;

        if (this.running) {
            info("[EDGE-STT] Connection lost. Restarting connection...");
            this.initConnection();
        }
    }

    handleTurnRestart() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        this.restartPending = true;

        this.currentRequestId = generateUuid();
        this.streamIdCounter++;

        const bytesPerSecond = this.sample_rate * CHANNELS * (BITS_PER_SAMPLE / 8);
        const secondsSent = this.bytesSent / bytesPerSecond;
        const offset100ns = Math.floor(secondsSent * 10_000_000);
        const currentOffset = String(offset100ns);

        const contextPayload = {
            audio: { streams: { "1": null } },
            continuation: {
                audio: { streams: { "1": { offset: currentOffset } } },
                previousServiceTag: this.currentServiceTag,
            },
        };

        this.wsSendText(
            createTextMessage(
                "speech.context",
                contextPayload,
                "application/json",
                this.currentRequestId,
            ),
        );

        this.sendWavHeader();

        this.restartPending = false;

        // info(`[EDGE-STT] Restarted stream. RequestId: ${this.currentRequestId} StreamId: ${this.streamIdCounter} Offset: ${currentOffset}`);
    }

    sendWavHeader() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const headerMsg = createBinaryMessage(
            "audio",
            String(this.streamIdCounter),
            this.currentRequestId,
            createWavHeader(this.sample_rate),
            "audio/x-wav",
        );
        this.ws.send(headerMsg);
    }

    async startAudioCapture() {
        this.audioStreamActive = true;

        const captureCallback = (
            chunk: Float32Array<ArrayBufferLike>,
        ) => {
            if (
                !this.audioStreamActive ||
                !this.ws ||
                this.ws.readyState !== WebSocket.OPEN ||
                this.restartPending
            ) {
                return;
            }

            const pcmBuffer = new ArrayBuffer(chunk.length * 2);
            const pcmView = new DataView(pcmBuffer);

            for (let i = 0; i < chunk.length; i++) {
                const sample = Math.max(-1, Math.min(1, chunk[i]));
                const pcmSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
                pcmView.setInt16(i * 2, pcmSample, true);
            }

            const pcmData = new Uint8Array(pcmBuffer);
            this.bytesSent += pcmData.length;

            const audioMsg = createBinaryMessage(
                "audio",
                String(this.streamIdCounter),
                this.currentRequestId,
                pcmData,
            );

            this.ws!.send(audioMsg);
        };

        if (this.desktop_capture) {
            this.worker_callback = await setupSystemAudioCapture(captureCallback);

            (async () => {
                    const res: boolean = await invoke("is_desktop_overlay_running");
                    if (res) info("[OVERLAY] Overlay is already running!");
                    else {
                        try {
                            info(
                                "[OVERLAY] Starting desktop overlay...",
                            );

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
            this.worker_callback = await setupMicrophoneCapture(captureCallback, this.mic);
        }
    }

    wsSendText(msg: string) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(msg);
        }
    }

    async cleanup() {
        this.audioStreamActive = false;

        if (this.ws) {
            try {
                this.ws.close();
            } catch {
                // ignore
            }
            this.ws = null;
        }
    }

    stop() {
        this.running = false;
        this.cleanup();

        if (this.worker_callback != null) {
            this.worker_callback().then(() => {
                info(`[EDGE-STT${this.desktop_capture ? " DESKTOP" : ""}] Audio capture stopped!`);
                
                this.worker_callback = null;
            }).catch((e) => {
                logError(`[EDGE-STT] Error stopping audio capture: ${e}`);
            });
        }

        this.current_status.connected = false;
        this.current_status.error = false;
        this.current_status.connection_established_time = 0;
        this.current_status.connection_init_time = 0;

        info(`[EDGE-STT${this.desktop_capture ? " DESKTOP" : ""}] Recognition stopped!`);
    }

    status(): EdgeSTTState {
        return this.current_status;
    }

    name(): string {
        return "EdgeSTT";
    }

    onResult(callback: (result: string[], final: boolean) => void): void {
        this.callback = callback;
    }

    async manual_trigger(data: string) {
        const result = [data, ""];
        for (let i = 0; i < 3; i++) {
            try {
                if (this.useEdgeTranslate) {
                    result[1] = await edge_translate(data, this.language_src, this.language_target);
                } else {
                    result[1] = await google_translate(data, this.language_src, this.language_target);
                }
            } catch (e) {
                error("[WEBSPEECH] Error translating using google translate!: " + e)
            }

            break
        }

        this.callback?.(result, true);
    }
}