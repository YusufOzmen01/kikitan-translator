import { Recognizer } from "./recognizer";

import {
    info,
    error
} from '@tauri-apps/plugin-log';

import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';

import { setupDesktopCapture, setupMicrophoneCapture } from "../util/audiocapture";
import { GEMINI_LIVE_API_MODEL, GEMINI_TRANSLATION_TRANSCRIPTION_PROMPT } from "../util/constants";
import { WebSpeech } from "./WebSpeech";

export enum GeminiState { NOT_CONNECTED, AUTH_FAILED, WS_CONNECTED, RECOGNITION_STARTED, RATE_LIMIT };

export type ResultCallback = ((result: string[], final: boolean) => void) | null;

export class Gemini extends Recognizer {
    stopCapture: (() => void) | null = null;
    callback: ResultCallback = null;
    webSpeech: WebSpeech | null = null;

    translation_only: boolean = false
    desktop_capture: boolean = false

    turn_over: boolean = false
    buffer: string = ""

    current_status: GeminiState = GeminiState.NOT_CONNECTED;

    ai: GoogleGenAI | null = null;
    session: Session | undefined;

    constructor(language_src: string, language_target: string, apikey: string, translation_only: boolean, jp_omit_questionmark: boolean = false, desktop_capture: boolean = false) {
        super(language_src, language_target);

        this.translation_only = translation_only

        if (this.translation_only) {
            this.webSpeech = new WebSpeech(language_src, "", true, jp_omit_questionmark)
        }

        this.desktop_capture = desktop_capture
        this.ai = new GoogleGenAI({ apiKey: apikey });
    }

    start() {
        this.init_gemini()
    }

    handleMessage({ buffer, turn_over, callback }: { buffer: string, turn_over: boolean, callback: ResultCallback }) {
        return (message: LiveServerMessage) => {
            if (message.serverContent?.turnComplete) {
                turn_over = true

                const data = buffer.split("|")

                callback?.([data[0].trim(), data[1].trim()], true)
            } else {
                if (turn_over) { buffer = ""; turn_over = false }

                if (typeof message.text === 'string') {
                    buffer += message.text;
                }
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleOpen({ status, running }: { status: GeminiState, running: boolean }) {
        return () => {
            status = GeminiState.WS_CONNECTED;

            running = true;

            console.log(`[GEMINI${this.desktop_capture ? " DESKTOP CAPTURE" : ""}] Connected to Gemini API! Status: ${status} - Running: ${running}`);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleClose({ status, running }: { status: GeminiState, running: boolean }) {
        return () => {
            status = GeminiState.NOT_CONNECTED;

            running = false;

            console.log(`[GEMINI${this.desktop_capture ? " DESKTOP CAPTURE" : ""}] Disconnected from Gemini API! Status: ${status} - Running: ${running}`);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleError({ desktop_capture, running }: { desktop_capture: boolean, running: boolean }) {
        return (e: ErrorEvent) => {
            error(`[GEMINI${desktop_capture ? " DESKTOP CAPTURE" : ""}] Error while connecting to Gemini API: ${e.message}`);

            running = false;
        }
    }

    async init_gemini() {
        this.session = await this.ai?.live.connect({
            model: GEMINI_LIVE_API_MODEL,
            callbacks: {
                onopen: this.handleOpen({ status: this.current_status, running: this.running }),
                onmessage: this.handleMessage({ buffer: this.buffer, turn_over: this.turn_over, callback: this.callback }),
                onerror: this.handleError({ desktop_capture: this.desktop_capture, running: this.running }),
                onclose: this.handleClose({ status: this.current_status, running: this.running }),
            },
            config: {
                responseModalities: [Modality.TEXT],
                systemInstruction: {
                    parts: [{ text: GEMINI_TRANSLATION_TRANSCRIPTION_PROMPT(this.language_src, this.language_target) }]
                }
            }
        })

        if (!this.translation_only) {
            const captureCallback = (chunk: Float32Array<ArrayBufferLike>, sampleRate: number) => {
                const pcmBuffer = new ArrayBuffer(chunk.length * 2);
                const pcmView = new DataView(pcmBuffer);

                for (let i = 0; i < chunk.length; i++) {
                    const sample = Math.max(-1, Math.min(1, chunk[i]));
                    const pcmSample = sample < 0
                        ? sample * 0x8000
                        : sample * 0x7FFF;

                    pcmView.setInt16(i * 2, pcmSample, true);
                }

                const uint8Array = new Uint8Array(pcmBuffer);

                let binaryString = '';
                for (let i = 0; i < uint8Array.length; i++) {
                    binaryString += String.fromCharCode(uint8Array[i]);
                }

                this.session?.sendRealtimeInput({ audio: { mimeType: `audio/pcm;rate=${sampleRate}`, data: btoa(binaryString) } });
            }

            this.stopCapture = this.desktop_capture ? await setupDesktopCapture(captureCallback) : await setupMicrophoneCapture(captureCallback);
        } else {
            this.webSpeech?.onResult(async (transcription, final) => {
                if (final) {
                    this.session?.sendClientContent({ turns: transcription[0] })
                }

                this.callback?.([transcription[0], ""], final)
            })

            this.webSpeech?.start()
        }

        this.current_status = GeminiState.RECOGNITION_STARTED
    }

    stop() {
        this.running = false;

        this.webSpeech?.stop();
        this.stopCapture?.();
        this.session?.close();

        info(`[GEMINI${this.desktop_capture ? " DESKTOP CAPTURE" : ""}] Recognition stopped!`)
    }

    status(): GeminiState {
        return this.current_status
    }

    onResult(callback: (result: string[], final: boolean) => void) {
        this.callback = callback
    }

    name(): string {
        return "Gemini"
    }

    // TODO: FIX
    async manual_trigger(data: string) {
        this.session?.sendClientContent({ turns: data })
    }
}