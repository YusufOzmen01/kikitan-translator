import { Recognizer } from "./recognizer";
import { VAD } from "../util/vad";
import { invoke } from "@tauri-apps/api/core";
import * as path from '@tauri-apps/api/path';

import {
    info,
    debug,
    error
} from '@tauri-apps/plugin-log';

export class Whisper extends Recognizer {
    vad: VAD = new VAD({
        silenceThreshold: 500,
        volumeThreshold: 0.05,
        sampleRate: 16000
    });
    callback: ((result: string, final: boolean) => void) | null = null
    setWhisperInitializingVisible: (state: number) => void;

    constructor(lang: string, setWhisperInitializingVisible: (state: number) => void) {
        super(lang);

        this.setWhisperInitializingVisible = setWhisperInitializingVisible

        this.init()
    }

    async init() {
        await invoke("start_whisper_helper", { helperPath: await path.join(await path.appLocalDataDir(), "whisper/whisperkikitan.exe") })

        for (let i = 0; i < 3; i++) {
            try {
                await fetch("http://127.0.0.1:7272/init_model", {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify({
                        modelpath: await path.join(await path.appLocalDataDir(), "whisper/model.bin"),
                        lang: this.language.split("-")[0]
                    })
                })

                this.setWhisperInitializingVisible(0)
                break;
            }
            catch (e) { error(`[WHISPER] Failed to initialize model (Retry ${i + 1}): ${e}`) }

            if (i == 2) this.setWhisperInitializingVisible(2)
        }
    }

    status(): boolean {
        return this.running;
    }

    start() {
        this.running = true;
        console.log("starting")

        this.vad.start(async (result) => {
            fetch("http://127.0.0.1:7272/run_detection", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    wavdata: result.audioBase64,
                    lang: this.language.split("-")[0]
                })
            }).then(data => {
                data.text().then(value => {
                    this.callback!(value, true)
                })
            }).catch(async () => {
                if (this.running) this.init()
            })
        })
        info("[WHISPER] Recognition started!")
    }

    stop() {
        this.running = false;
        this.vad.stop()

        info("[WHISPER] Recognition stopped!")
    }

    set_lang(lang: string) {
        this.language = lang
        this.init()

        debug("[WEBSPEECH] Language set to " + lang)
    }

    onResult(callback: (result: string, final: boolean) => void) {
        this.callback = callback
    }
}