'use client'

import * as React from "react"

import { Select, MenuItem, CircularProgress } from "@mui/material"
import { invoke } from '@tauri-apps/api/tauri'

var sr = null
const lang = ["en-US", "en-UK", "ja-JP", "tr"]
const GOOGLE_SCRIPTS_URL = "https://script.google.com/macros/s/AKfycbyJAqvnM48iCprE_YyNnb03F0yG3fipQCgy_AEWjZI_bk6uSy6zyrfa9CQasHEw_dwJew/exec"

export default function Kikitan(ovr, vrc, translator) {
    const [detecting, setDetecting] = React.useState(true)
    const [translated, setTranslated] = React.useState("")
    const [detection, setDetection] = React.useState("")
    const [sourceLanguage, setSourceLanguage] = React.useState(typeof window !== 'undefined' ? localStorage.getItem("sourceLanguage") == null ? 2 : parseInt(localStorage.getItem("sourceLanguage")) : 2)
    const [targetLanguage, setTargetLanguage] = React.useState(typeof window !== 'undefined' ? localStorage.getItem("targetLanguage") == null ? 0 : parseInt(localStorage.getItem("targetLanguage")) : 0)
    const [detectionTimeout, setDetectionTimeout] = React.useState(null)
    
    React.useEffect(() => {
        if (detectionTimeout != null) clearTimeout(detectionTimeout)

        setDetectionTimeout(setTimeout(() => {
            setDetecting(false)

            return
        }, 5000))
    }, [detection])

    React.useEffect(() => {
        sr = new window.webkitSpeechRecognition();
        sr.interimResults = true
        sr.maxAlternatives = 1
        sr.continuous = true,

        sr.onend = () => {
            console.log("Recognizer stopped. Restarting recognizer...")
            setTimeout(() => {
                try {
                    sr.start()
                } catch { }

                console.log("Recognizer restarted!")
            }, 200)
        }

        sr.onresult = (res => {
            if (res.results[res.results.length - 1][0].transcript.trim().length == 0) return;

            setDetection(res.results[res.results.length - 1][0].transcript)
            setDetecting(!res.results[res.results.length - 1].isFinal)
        })

        sr.start()
    }, [])

    React.useEffect(() => {
        sr.lang = lang[sourceLanguage]

        if ((sourceLanguage == 0 || sourceLanguage == 1) && targetLanguage == 0) {
            setTargetLanguage(2)
        } else if (sourceLanguage == 2 && targetLanguage == 2) {
            setTargetLanguage(0)
        }

        localStorage.setItem("sourceLanguage", sourceLanguage)

        sr.stop()
    }, [sourceLanguage])

    React.useEffect(() => {
        if ((sourceLanguage == 0 || sourceLanguage == 1) && targetLanguage == 0) {
            setSourceLanguage(0)
        } else if (sourceLanguage == 2 && targetLanguage == 2) {
            setSourceLanguage(0)
        }

        localStorage.setItem("targetLanguage", targetLanguage)
    }, [targetLanguage])

    React.useEffect(() => {
        if (!detecting && detection.trim() != "") {
            if (detectionTimeout != null) clearTimeout(detectionTimeout)
            if (ovr) {
                invoke("send_ovr", { data: detection.trim() }).then(() => console.log("Sent to ovr!"));

                return;
            }

            if (!vrc) return;

            invoke("send_typing", {}).then(() => console.log("Sent writing message packet!"))

            switch (translator) {
                case 0:
                    (async () => {
                        try {
                            const res = await fetch(GOOGLE_SCRIPTS_URL + `?text=${detection}&source=${lang[sourceLanguage]}&target=${lang[targetLanguage]}`)
                            const text = unescape(await res.text()).trim()

                            invoke("send_message", { msg: `${text} (${detection.trim()})` }).then(() => console.log("Sent message!"))

                            setTranslated(text)

                        } catch {
                            setTranslated(false)
                         }
                    })();

                    break;
                case 1:
                    (async () => {
                        try {
                            const res = await(await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${lang[sourceLanguage]}&tl=${lang[targetLanguage]}&dt=t&dt=bd&dj=1&q=${detection.trim().replaceAll("%", "%25")}`)).json()
                            console.log(res)
                            
                            let final = unescape(res.sentences[0].trans)

                            for (let i = 1; i < res.sentences.length; i++) {
                                final += " " + unescape(res.sentences[i].trans)
                            }
                            
                            invoke("send_message", { msg: `${final} (${detection.trim()})` }).then(() => console.log("Sent message!"))

                            setTranslated(final)
                        } catch { }
                    })();

                    break;
            }
        }
    }, [detecting])

    return <>
        <div className="flex align-middle">
            <div className={`mr-16 w-96 h-48 outline outline-2 outline-slate-400 rounded-md font-bold text-center ${detecting ? "text-slate-700 italic" : "text-black"}`}>
                <p className="align-middle">{detection}</p>
            </div>
            <div className="w-96 h-48 outline outline-2 outline-slate-400 rounded-md text-black font-bold text-center">
                <p className="align-middle">{translated}</p>
            </div>
        </div>
        <div className="flex align-middle mt-8">
            <Select className="mr-4" value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)}>
                <MenuItem value={0}>English (United States)</MenuItem>
                <MenuItem value={1}>English (United Kingdom)</MenuItem>
                <MenuItem value={2}>日本語</MenuItem>
                <MenuItem value={3}>Türkçe</MenuItem>
            </Select>
            <Select className="ml-4" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
                <MenuItem value={0}>English</MenuItem>
                <MenuItem value={2}>日本語</MenuItem>
                <MenuItem value={3}>Türkçe</MenuItem>
            </Select>
        </div>
    </>
}