import { Recognizer } from "./recognizer";
import { invoke } from "@tauri-apps/api/core";

import { info, error } from "@tauri-apps/plugin-log";

import {
    GoogleGenAI,
    LiveServerMessage,
    Modality,
    Session,
} from "@google/genai";

import {
    setupMicrophoneCapture,
    setupSystemAudioCapture,
} from "../util/audiocapture";
import {
    GEMINI_LIVE_API_MODEL,
    GEMINI_TRANSLATION_TRANSCRIPTION_PROMPT,
} from "../util/constants";
import { WebSpeech } from "./WebSpeech";

export type GeminiState = {
    connection_init_time: number;
    connection_established_time: number;

    connected: boolean;
    error: boolean;

    error_message?: string;
};

export type ResultCallback =
    | ((result: string[], final: boolean) => void)
    | null;

export class Gemini extends Recognizer {
    restartInterval: NodeJS.Timeout | null = null;
    callback: ResultCallback = null;
    webSpeech: WebSpeech | null = null;

    translation_only: boolean = false;
    desktop_capture: boolean = false;

    api_key: string = "";

    turn_over: boolean = false;
    buffer: string = "";
    transcription: string = "";

    current_status: GeminiState = {
        connected: false,
        error: false,

        connection_established_time: 0,
        connection_init_time: 0,
    };

    ai: GoogleGenAI | null = null;
    session: Session | undefined;

    start_timeout: NodeJS.Timeout | null = null;

    constructor(
        language_src: string,
        language_target: string,
        apikey: string,
        translation_only: boolean,
        jp_omit_questionmark: boolean = false,
        desktop_capture: boolean = false,
    ) {
        super(language_src, language_target);

        this.translation_only = translation_only;

        if (this.translation_only) {
            this.webSpeech = new WebSpeech(
                language_src,
                "",
                true,
                jp_omit_questionmark,
            );
        } else {
            const captureCallback = (
                chunk: Float32Array<ArrayBufferLike>,
                sampleRate: number,
            ) => {
                const pcmBuffer = new ArrayBuffer(chunk.length * 2);
                const pcmView = new DataView(pcmBuffer);

                for (let i = 0; i < chunk.length; i++) {
                    const sample = Math.max(-1, Math.min(1, chunk[i]));
                    const pcmSample =
                        sample < 0 ? sample * 0x8000 : sample * 0x7fff;

                    pcmView.setInt16(i * 2, pcmSample, true);
                }

                const uint8Array = new Uint8Array(pcmBuffer);

                let binaryString = "";
                for (let i = 0; i < uint8Array.length; i++) {
                    binaryString += String.fromCharCode(uint8Array[i]);
                }

                this.session?.sendRealtimeInput({
                    audio: {
                        mimeType: `audio/pcm;rate=${sampleRate}`,
                        data: btoa(binaryString),
                    },
                });
            };

            if (desktop_capture) {
                setupSystemAudioCapture(captureCallback);

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
            } else setupMicrophoneCapture(captureCallback);
        }

        this.desktop_capture = desktop_capture;
        this.ai = new GoogleGenAI({ apiKey: apikey });
        this.api_key = apikey;
    }

    start() {
        this.running = true;

        this.restartInterval = setInterval(() => {
            if (
                this.running &&
                !this.current_status.connected &&
                !this.current_status.error
            ) {
                info(
                    `[GEMINI${this.desktop_capture ? " DESKTOP CAPTURE" : ""}] Reconnecting to Gemini API...`,
                );

                this.init_gemini();
            }
        }, 10000);

        this.init_gemini();
    }

    handleMessage({
        buffer,
        transcription,
        turn_over,
        callback,
    }: {
        buffer: string;
        transcription: string;
        turn_over: boolean;
        callback: ResultCallback;
    }) {
        return (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription?.text) {
                if (typeof message.serverContent.inputTranscription.text === 'string') {
                    transcription += message.serverContent.inputTranscription.text;

                    callback?.([transcription, ""], false);
                }
            }

            if (message.serverContent?.turnComplete) {
                turn_over = true;

                const parts = buffer.split('|');

                callback?.([parts[0].trim(), parts[1].trim()], true);
                transcription = "";
                buffer = "";
            } else {
                if (turn_over) {
                    buffer = "";
                    turn_over = false;
                }

                if (typeof message.text === "string") {
                    buffer += message.text;
                }
            }
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleOpen({ status }: { status: GeminiState }) {
        return () => {
            status.connection_established_time = Date.now();
            status.connected = true;

            console.log(
                `[GEMINI${this.desktop_capture ? " DESKTOP CAPTURE" : ""}] Connected to Gemini API! Status: ${JSON.stringify(status)}`,
            );

            if (this.translation_only) {
                this.webSpeech?.onResult(async (transcription, final) => {
                    if (final) {
                        this.session?.sendClientContent({
                            turns: transcription[0],
                        });
                    }

                    this.callback?.([transcription[0], ""], final);
                });

                this.webSpeech?.start();
            }
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleClose({ status }: { status: GeminiState }) {
        return () => {
            status.connected = false;

            console.log(
                `[GEMINI${this.desktop_capture ? " DESKTOP CAPTURE" : ""}] Disconnected from Gemini API! Status: ${JSON.stringify(status)}`,
            );

            if (this.start_timeout) clearTimeout(this.start_timeout);
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleError({
        desktop_capture,
        status,
    }: {
        desktop_capture: boolean;
        status: GeminiState;
    }) {
        return (e: ErrorEvent) => {
            error(
                `[GEMINI${desktop_capture ? " DESKTOP CAPTURE" : ""}] Error while connecting to Gemini API: ${e.message}`,
            );

            status.connected = false;
            status.error = true;
            status.error_message = e.message;

            if (this.start_timeout) clearTimeout(this.start_timeout);
        };
    }

    async init_gemini() {
        this.session?.close();
        this.session = undefined;

        try {
            const res = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models?key=" +
                this.api_key,
            );
            if (!res.ok) {
                error(
                    `[GEMINI${this.desktop_capture ? " DESKTOP CAPTURE" : ""}] Invalid API key.`,
                );

                this.current_status.connected = false;
                this.current_status.error = true;
                this.current_status.error_message =
                    "API key is invalid or not set!";

                return;
            }
        } catch {
            error(
                `[GEMINI${this.desktop_capture ? " DESKTOP CAPTURE" : ""}] Invalid API key.`,
            );

            this.current_status.connected = false;
            this.current_status.error = true;
            this.current_status.error_message =
                "API key is invalid or not set!";

            return;
        }

        this.current_status.connection_init_time = Date.now();
        this.session = await this.ai?.live.connect({
            model: GEMINI_LIVE_API_MODEL,
            callbacks: {
                onopen: this.handleOpen({ status: this.current_status }),
                onmessage: this.handleMessage({
                    buffer: this.buffer,
                    transcription: this.transcription,
                    turn_over: this.turn_over,
                    callback: this.callback,
                }),
                onerror: this.handleError({
                    desktop_capture: this.desktop_capture,
                    status: this.current_status,
                }),
                onclose: this.handleClose({ status: this.current_status }),
            },
            config: {
                responseModalities: [Modality.TEXT],
                systemInstruction: {
                    parts: [
                        {
                            text: GEMINI_TRANSLATION_TRANSCRIPTION_PROMPT(
                                this.language_src,
                                this.language_target,
                            ),
                        },
                    ],
                },
                inputAudioTranscription: {},
            },
        });
    }

    stop() {
        this.running = false;

        this.webSpeech?.stop();
        this.session?.close();
        this.session = undefined;

        this.current_status.connected = false;
        this.current_status.error = false;
        this.current_status.connection_established_time = 0;
        this.current_status.connection_init_time = 0;

        if (this.restartInterval) clearInterval(this.restartInterval);

        info(
            `[GEMINI${this.desktop_capture ? " DESKTOP CAPTURE" : ""}] Recognition stopped!`,
        );
    }

    status(): GeminiState {
        return this.current_status;
    }

    onResult(callback: (result: string[], final: boolean) => void) {
        this.callback = callback;
    }

    name(): string {
        return "Gemini";
    }

    // TODO: FIX
    async manual_trigger(data: string) {
        this.session?.sendClientContent({ turns: data });
    }
}
