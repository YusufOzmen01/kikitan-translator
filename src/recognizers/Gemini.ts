import { Recognizer } from "./recognizer";

import {
    info,
    debug,
    error
} from '@tauri-apps/plugin-log';

import { setupMicrophoneCapture } from "../util/audiocapture";

export enum GeminiState { NOT_CONNECTED, AUTH_FAILED, WS_CONNECTED, RECOGNITION_STARTED };

export class Gemini extends Recognizer {
    stopRecognizer: (() => void) | null = null;
    callback: ((result: string, final: boolean) => void) | null = null;

    socket: WebSocket | null = null;
    apikey: string = ""

    target_lang: string = ""
    restartInterval: NodeJS.Timeout | null = null

    turn_over: boolean = false
    buffer: string = ""

    current_status: GeminiState = GeminiState.NOT_CONNECTED;

    constructor(lang: string, target_lang: string, apikey: string) {
        super(lang);

        this.apikey = apikey
        this.target_lang = target_lang
    }

    start() {
        this.init()

        this.restartInterval = setInterval(() => {
            if (this.running == true) {
                this.init()
            }
        }, 300000)
    }

    async init() {
        this.stopRecognizer?.();
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

        this.socket?.close()
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
                                "parts": [{ "text": `You are a translator that has the ability to translate and transcript. User will say something, and you will both transcribe it in [${this.language}] and translate it in [${this.target_lang}] (both of them are language codes). The example output format you should respond is this: (transcription is [tr] and translation is [en]) { "transcription": "Merhaba.", translation: "Hello." }. If the languages use a non roman alphabet, use their alphabet. Also, only try to transcribe in the language that I've told you to transcribe.If there are words of other languages mid sentence, that's fine.` }]
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

                        this.callback?.(this.buffer, true)
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

    stop() {
        (async () => {
            this.running = false;

            this.stopRecognizer?.();
            clearInterval(this.restartInterval!);
            this.socket?.close()

            info("[GEMINI] Recognition stopped!")
        })();

    }

    set_lang(lang: string) {
        this.language = lang

        debug("[GEMINI] Language set to " + lang)

        this.init()
    }

    status(): GeminiState {
        return this.current_status
    }

    onResult(callback: (result: string, final: boolean) => void) {
        this.callback = callback
    }

    name(): string {
        return "Gemini"
    }

    manual_trigger(data: string) {
        this.socket?.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: [{ "text": data }] }], "turnComplete": true } }))
    }
}