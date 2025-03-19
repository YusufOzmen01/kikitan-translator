import { Recognizer } from "./recognizer";

import {
    info,
    debug,
    error
} from '@tauri-apps/plugin-log';

import { setupMicrophoneCapture } from "../util/audiocapture";
import { GEMINI_TRANSLATION_TRANSCRIPTION_PROMPT } from "../util/constants";
import { WebSpeech } from "./WebSpeech";

import gemini_translate from "../translators/gemini_translate";
import google_translate from "../translators/google_translate";

export enum GeminiState { NOT_CONNECTED, AUTH_FAILED, WS_CONNECTED, RECOGNITION_STARTED, RATE_LIMIT };

export class Gemini extends Recognizer {
    stopRecognizer: (() => void) | null = null;
    callback: ((result: string[], final: boolean) => void) | null = null;
    webSpeech: WebSpeech | null = null;

    socket: WebSocket | null = null;
    apikey: string = ""
    translation_only: boolean = false

    restartInterval: NodeJS.Timeout | null = null

    turn_over: boolean = false
    buffer: string = ""

    current_status: GeminiState = GeminiState.NOT_CONNECTED;

    constructor(language_src: string, language_target: string, apikey: string, translation_only: boolean, jp_omit_questionmark: boolean = false) {
        super(language_src, language_target);

        this.apikey = apikey
        this.translation_only = translation_only

        if (this.translation_only) {
            this.webSpeech = new WebSpeech(language_src,"", true, jp_omit_questionmark)
        }
    }

    start() {
        if (!this.translation_only) {
            this.init_transcription_translation()
            this.restartInterval = setInterval(() => {
                if (this.running == true) {
                    this.init_transcription_translation()
                }
            }, 300000)
        } else {
            this.init_translation()
        }
    }

    async init_transcription_translation() {
        this.stop()
        try {
            const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp?key=" + this.apikey)

            if (resp.status != 200) {
                this.current_status = GeminiState.AUTH_FAILED

                return
            }
        } catch {
            this.current_status = GeminiState.AUTH_FAILED

            return
        }

        this.socket = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.apikey}`)

        if (this.socket) {
            this.socket.onopen = async () => {
                this.current_status = GeminiState.WS_CONNECTED
                this.socket?.send(JSON.stringify(
                    {
                        "setup": {
                            "model": "models/gemini-2.0-flash-exp",
                            "generationConfig": {
                                "responseModalities": "text",
                            },
                            "systemInstruction": {
                                "parts": [{ "text": GEMINI_TRANSLATION_TRANSCRIPTION_PROMPT(this.language_src, this.language_target) }]
                            },
                        }
                    }
                ))
            }

            this.socket.onmessage = async (data) => {
                const text = await data.data.text()

                if (text.trim().replaceAll("\n", "").replaceAll(" ", "") == '{"setupComplete":{}}') {
                    this.current_status = GeminiState.RECOGNITION_STARTED
                    this.stopRecognizer = await setupMicrophoneCapture((chunk, sampleRate) => {
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

                        this.socket?.send(JSON.stringify({ realtimeInput: { mediaChunks: [{ mimeType: `audio/pcm;rate=${sampleRate}`, data: btoa(binaryString) }] } }))
                    })

                    this.running = true;

                    info("[GEMINI] Recognition started!")
                } else {
                    const json = JSON.parse(text)

                    if (json.serverContent.turnComplete == true) {
                        this.turn_over = true

                        const data = JSON.parse(this.buffer)

                        this.callback?.([data.transcription, data.translation], true)
                    } else {
                        if (this.turn_over == true) { this.buffer = ""; this.turn_over = false }

                        this.buffer += json.serverContent.modelTurn.parts[0].text;
                    }
                }
            }

            this.socket.onerror = (e) => {
                this.current_status = GeminiState.NOT_CONNECTED

                error("[GEMINI SR] Error while starting the recognizer: " + e)
            }

            this.socket.close = () => {
                this.current_status = GeminiState.NOT_CONNECTED

                error("[GEMINI SR] Websocket connection closed.")
            }
        }
    }

    async init_translation() {
        try {
            const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp?key=" + this.apikey)

            if (resp.status != 200) {
                this.current_status = GeminiState.AUTH_FAILED

                return
            }
        } catch {
            this.current_status = GeminiState.AUTH_FAILED

            return
        }

        this.current_status = GeminiState.WS_CONNECTED

        this.webSpeech?.onResult(async (transcription, final) => {
            const result = [transcription[0], ""]

            if (final) {
                try {
                    result[1] = await gemini_translate(transcription[0], this.language_src, this.language_target, this.apikey)
                } catch (e) {
                    if (!(e instanceof Error)) return;
                    
                    switch (e.message) {
                        case "AUTH_FAIL":
                            this.current_status = GeminiState.AUTH_FAILED
                            break
                        case "RATE_LIMIT":
                            this.current_status = GeminiState.RATE_LIMIT

                            result[1] = await google_translate(transcription[0], this.language_src, this.language_target)
                            break   
                        default:
                            error("[GEMINI] Error translating using gemini translate!: " + e)
                            break
                    }
                }
            }

            this.callback?.(result, final)
        })
        this.webSpeech?.start()

        this.current_status = GeminiState.RECOGNITION_STARTED
    }

    stop() {
        (async () => {
            this.running = false;

            this.stopRecognizer?.();
            clearInterval(this.restartInterval!);
            this.socket?.close()

            if (this.translation_only) this.webSpeech?.stop()

            info("[GEMINI] Recognition stopped!")
        })();

    }

    set_lang(language_src: string, language_target: string) {
        this.language_src = language_src
        if (language_target.trim().length != 0) {
            this.language_target = language_target

            debug(`[GEMINI] Language target set to ${language_target}`)
        }

        debug(`[GEMINI] Language source set to ${language_src}`)

        if (!this.translation_only) this.init_transcription_translation()
        else this.webSpeech?.set_lang(language_src, language_target)

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

    async manual_trigger(data: string) {
        const result = [data, await gemini_translate(data, this.language_src, this.language_target, this.apikey)]
        this.callback?.(result, true)

        // this.socket?.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ "text": data }] }], "turnComplete": true } }))
    }
}