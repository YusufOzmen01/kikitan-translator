import { Recognizer } from "./recognizer";

import {
    info,
    error,
    debug
} from '@tauri-apps/plugin-log';

export class WebSpeech extends Recognizer {
    recognition: SpeechRecognition;
    callback: ((result: string, final: boolean) => void) | null = null

    constructor(lang: string) {
        super(lang);

        this.recognition = new window.webkitSpeechRecognition();
        this.recognition.interimResults = true
        this.recognition.maxAlternatives = 1
        this.recognition.continuous = true
        this.recognition.lang = lang;
    }

    start() {
        this.running = true;
        try {
            this.recognition.start();

            info("[WEBSPEECH] Recognition started!")
        } catch (e) {
            error("[WEBSPEECH] Error starting recognition: " + e)
        }

        this.recognition.onend = () => {
            if (this.running) {
                setTimeout(() => {
                    try {
                        this.recognition.start();
                    } catch { /* empty */ }
                }, 500);
            }
        }

        this.recognition.onnomatch = () => {
            if (this.running) {
                setTimeout(() => {
                    try {
                        this.recognition.start();
                    } catch { /* empty */ }
                }, 500);
            }
        }

        this.recognition.onerror = (e) => {
            if (e.message.trim().length != 0) error("[WEBSPEECH] Error: " + e.message)

            if (this.running) {
                setTimeout(() => {
                    try {
                        this.recognition.start();
                    } catch { /* empty */ }
                }, 500);
            }
        }
    }

    stop() {
        this.running = false;
        this.recognition.stop();

        info("[WEBSPEECH] Recognition stopped!")
    }

    set_lang(lang: string) {
        this.recognition.lang = lang;

        debug("[WEBSPEECH] Language set to " + lang)
        this.recognition.stop();

        debug("[WEBSPEECH] Restarting in 500ms...")
        setTimeout(() => {
            this.recognition.start();
        }, 500);
    }

    status(): boolean {
        return this.running;
    }

    onResult(callback: (result: string, final: boolean) => void) {
        this.callback = callback

        this.recognition.onresult = (event) => {
            if (event.results.length > 0) {
                

                callback(event.results[event.results.length - 1][0].transcript.trim(), event.results[event.results.length - 1].isFinal);
            }
        }
    }

    name(): string {
        return "WebSpeech";
    }

    manual_trigger(data: string): void {
        this.callback?.(data, true);
    }
}