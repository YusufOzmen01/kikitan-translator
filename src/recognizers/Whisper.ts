import { Recognizer } from "./recognizer";
import { MicVAD, utils } from "@ricky0123/vad-web"
import { invoke } from "@tauri-apps/api/core";
import * as path from '@tauri-apps/api/path';

import {
    info,
    debug,
    error
} from '@tauri-apps/plugin-log';

export class Whisper extends Recognizer {
    vad: MicVAD | undefined;
    callback: ((result: string, final: boolean) => void) | null = null
    setWhisperInitializingVisible: (state: number) => void;

    constructor(lang: string, setWhisperInitializingVisible: (state: number) => void) {
        super(lang);

        this.setWhisperInitializingVisible = setWhisperInitializingVisible
    }

    init() {
        navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                echoCancellation: true,
                autoGainControl: true,
                noiseSuppression: true,
            },
        }).then(async stream => {
            this.vad = await MicVAD.new({
                stream,
                model: "v5",
                baseAssetPath: "/",
                ortConfig: (ort) => {
                    ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";
                },
                onnxWASMBasePath: "/",
                positiveSpeechThreshold: 0.4,
                negativeSpeechThreshold: 0.25,
                minSpeechFrames: 1,
                preSpeechPadFrames: 20,
                onSpeechEnd: async (arr) => {
                    const wavBuffer = utils.encodeWAV(arr, 1, 16000, 1, 16)
                    const base64 = utils.arrayBufferToBase64(wavBuffer)

                    const data = await fetch("http://127.0.0.1:8080/run_detection", {
                        method: "POST",
                        headers: {
                            "content-type": "application/json",
                        },
                        body: JSON.stringify({
                            wavdata: base64,
                            lang: this.language.split("-")[0]
                        })
                    })

                    console.log()

                    this.callback!(await data.text(), true)
                },
            })

            this.vad.start()
            await invoke("start_whisper_helper", { helperPath: await path.join(await path.appLocalDataDir(), "whisper/whisperkikitan.exe") })

            setTimeout(async () => {
                fetch("http://127.0.0.1:8080/init_model", {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify({
                        modelpath: await path.join(await path.appLocalDataDir(), "whisper/model.bin"),
                        lang: this.language.split("-")[0]
                    })
                }).then(() => {
                    this.setWhisperInitializingVisible(0)
                }).catch((e) => {
                    error("[WHISPER] Failed to initialize model: " + e)
    
                    this.setWhisperInitializingVisible(2)
                })
            }, 1000)
        })
    }

    start() {
        this.running = true;
        if (this.vad == undefined) return this.init()

        this.vad.start()
        info("[WHISPER] Recognition started!")
    }

    stop() {
        this.running = false;
        this.vad?.pause()
        this.vad = undefined

        info("[WHISPER] Recognition stopped!")
    }

    set_lang(lang: string) {
        this.language = lang
        this.vad?.pause()
        this.vad = undefined
        this.init()

        debug("[WEBSPEECH] Language set to " + lang)
    }

    onResult(callback: (result: string, final: boolean) => void) {
        this.callback = callback
    }
}