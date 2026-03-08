import { Recognizer } from "./recognizer";

import {
    info,
    error,
    debug
} from '@tauri-apps/plugin-log';

import google_translate from "../translators/google_translate";
import edge_translate from "../translators/edge_translate";
import groq_translate from "../translators/groq_translate";
import { Config, load_config } from "../util/config";

const translators = [google_translate, edge_translate, groq_translate];

export class WebSpeech extends Recognizer {
    recognition: SpeechRecognition;
    no_translate: boolean = false;

    callback: ((result: string[], final: boolean) => void) | null = null
    setSRLoading: ((loading: boolean) => void) | null = null;
    showNotification: ((message: string, severity: "success" | "error" | "warning" | "info") => void) | null = null;
    setConfig: ((config: Config) => void) | null = null;

    constructor(language_src: string, language_target: string, no_translate: boolean = false, setSRLoading: ((loading: boolean) => void) | null = null, showNotification: ((message: string, severity: "success" | "error" | "warning" | "info") => void) | null = null, setConfig: ((config: Config) => void) | null = null) {
        super(language_src, language_target);

        this.recognition = new window.webkitSpeechRecognition();
        this.recognition.interimResults = true
        this.recognition.maxAlternatives = 1
        this.recognition.continuous = true
        this.recognition.lang = language_src;
        this.no_translate = no_translate;
        this.setSRLoading = setSRLoading;
        this.showNotification = showNotification;
        this.setConfig = setConfig;
    }

    start() {
        this.running = true;
        this.setSRLoading?.(true);
        try {
            this.recognition.start();
        } catch (e) {
            error("[WEBSPEECH] Error starting recognition: " + e)

            this.showNotification?.("[WEBSPEECH] Error starting recognition: " + e, "error");
        }

        this.recognition.onstart = () => {
            this.setSRLoading?.(false);

            info("[WEBSPEECH] Recognition started!")
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
            if (e.message.trim().length != 0) {
                error("[WEBSPEECH] Error: " + e.message)

                this.showNotification?.("[WEBSPEECH] Error: " + e.message, "error");
            }

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
                const transcript = event.results[event.results.length - 1][0].transcript.trim()
                const isFinal = event.results[event.results.length - 1].isFinal

                const result = [transcript, ""]


                callback(result, false);

                if (isFinal && !this.no_translate) {
                    const config = load_config();

                    try {
                        const val = await translators[config.translator_settings.translation_service](transcript, this.language_src, this.language_target, this.showNotification, this.setConfig);

                        result[1] = val
                    } catch (e) {
                        error(`[EDGE-STT] Error translating using ${config.translator_settings.translation_service}: ${e}`);
                    }

                    callback(result, isFinal);
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
        const config = load_config();

        if (!this.no_translate) {
            try {
                const val = await translators[config.translator_settings.translation_service](data, this.language_src, this.language_target, this.showNotification, this.setConfig);
                
                result[1] = val
            } catch (e) {
                error(`[EDGE-STT] Error translating using ${config.translator_settings.translation_service}: ${e}`);
            }
        }

        this.callback?.(result, true);
    }
}