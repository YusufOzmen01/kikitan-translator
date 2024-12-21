import { Recognizer } from "./recognizer";
import { MicVAD, utils } from "@ricky0123/vad-web"

import {
    info,
    debug
} from '@tauri-apps/plugin-log';

export class Whisper extends Recognizer {
    vad: MicVAD | undefined;
    callback: ((result: string, final: boolean) => void) | null = null

    constructor(lang: string) {
        super(lang);
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
                negativeSpeechThreshold: 0.4,
                minSpeechFrames: 5,
                preSpeechPadFrames: 30,
                onSpeechEnd: async (arr) => {
                    const wavBuffer = utils.encodeWAV(arr)
                    const base64 = utils.arrayBufferToBase64(wavBuffer)
                    const url = `data:audio/wav;base64,${base64}`

                    const data = await fetch("http://127.0.0.1:8000", {
                        method: "POST",
                        headers: {
                            "content-type": "application/json",
                        },
                        body: JSON.stringify({
                            data: url,
                            lang: this.language.split("-")[0]
                        })
                    })

                    this.callback!((await data.json()).text, true)
                },
            })

            this.vad.start()
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