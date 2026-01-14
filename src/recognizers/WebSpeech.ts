import { Recognizer } from "./recognizer";

import {
    info,
    error,
    debug
} from '@tauri-apps/plugin-log';

import google_translate from "../translators/google_translate";

export class WebSpeech extends Recognizer {
    recognition: SpeechRecognition;
    no_translate: boolean = false;
    jp_omit_questionmark: boolean = false;
    callback: ((result: string[], final: boolean) => void) | null = null

    constructor(language_src: string, language_target: string, no_translate: boolean = false, jp_omit_questionmark: boolean = false) {
        super(language_src, language_target);

        this.recognition = new window.webkitSpeechRecognition();
        this.recognition.interimResults = true
        this.recognition.maxAlternatives = 1
        this.recognition.continuous = true
        this.recognition.lang = language_src;
        this.no_translate = no_translate;
        this.jp_omit_questionmark = jp_omit_questionmark
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

    set_lang(language_src: string, language_target: string) {
        this.recognition.lang = language_src;

        if (language_target.trim().length != 0) {
            this.language_target = language_target

            debug(`[WEBSPEECH] Language target set to ${language_target}`)
        }

        debug(`[WEBSPEECH] Language source set to ${language_target}`)
        this.recognition.stop();

        debug("[WEBSPEECH] Restarting in 500ms...")
        setTimeout(() => {
            this.recognition.start();
        }, 500);
    }

    status(): boolean {
        return this.running;
    }

    onResult(callback: (result: string[], final: boolean) => void) {
        this.callback = callback

        this.recognition.onresult = async (event) => {
            if (event.results.length > 0) {
                let transcript = event.results[event.results.length - 1][0].transcript.trim()
                const isFinal = event.results[event.results.length - 1].isFinal
                
                if (this.language_src == "ja" && this.jp_omit_questionmark) {
                    transcript = transcript.replace("？", "")
                }

                const result = [transcript, ""]

                
                callback(result, false);

                if (isFinal && !this.no_translate) {
                    for (let i = 0; i < 3; i++) {
                        try {
                            result[1] = await google_translate(transcript, this.language_src, this.language_target);
                        } catch (e) {
                            error("[WEBSPEECH] Error translating using google translate!: " + e)
                        }

                        callback(result, isFinal);

                        break
                    }
                } else {
                    callback(result, isFinal && this.no_translate);
                }
            }
        }
    }

    name(): string {
        return "WebSpeech";
    }

    async manual_trigger(data: string) {
        const result = [data, ""];
        if (!this.no_translate) {
            for (let i = 0; i < 3; i++) {
                try {
                    result[1] = await google_translate(data, this.language_src, this.language_target);
                } catch (e) {
                    error("[WEBSPEECH] Error translating using google translate!: " + e)
                }

                break
            }
        }

        this.callback?.(result, true);
    }
}