'use client'

import * as React from "react"

import { Select, MenuItem } from "@mui/material"

import { invoke } from '@tauri-apps/api/tauri'

import { calculateMinWaitTime, langSource, langTo } from "./util/constants"
import { default as translateGS } from './translators/google_scripts';
import { default as translateGT } from './translators/google_translate';

var sr = null

export default function Kikitan(ovr, vrc, translator) {
    const [detecting, setDetecting] = React.useState(true)
    const [detection, setDetection] = React.useState("")
    const [detectionQueue, setDetectionQueue] = React.useState([])
    const [translated, setTranslated] = React.useState("")
    const [updateQueue, setUpdateQueue] = React.useState(false)

    const [sourceLanguage, setSourceLanguage] = React.useState(typeof window !== 'undefined' ? localStorage.getItem("sourceLanguage") == null ? 2 : parseInt(localStorage.getItem("sourceLanguage")) : 2)
    const [targetLanguage, setTargetLanguage] = React.useState(typeof window !== 'undefined' ? localStorage.getItem("targetLanguage") == null ? 0 : parseInt(localStorage.getItem("targetLanguage")) : 0)

    React.useEffect(() => {
        const new_queue = detectionQueue.slice(1)

        setDetectionQueue(new_queue)
    }, [updateQueue])

    React.useEffect(() => {
        sr = new window.webkitSpeechRecognition();
        sr.interimResults = true
        sr.maxAlternatives = 1
        sr.continuous = true

        sr.onend = () => {
            setTimeout(() => {
                try {
                    sr.start()
                } catch { }
            }, 200)
        }

        sr.onerror = console.log

        sr.onresult = (res => {
            if (res.results[res.results.length - 1][0].transcript.trim().length == 0) return;

            setDetection(res.results[res.results.length - 1][0].transcript.trim())
            setDetecting(!res.results[res.results.length - 1].isFinal)
        })

        sr.start();
    }, [])

    React.useEffect(() => {
        (async () => {
            if (detectionQueue.length == 0) return;

            const next = detectionQueue[0];
            let text = ""

            invoke("send_typing", {})

            switch (translator) {
                case 0:
                    translateGS(next, langSource[sourceLanguage].code, langTo[targetLanguage].code)
                        .then(final => {
                            invoke("send_message", { msg: `${final} (${next})` })

                            text = final

                            setTranslated(final)
                        }).catch(e => {
                            setTranslated(e)
                        })

                    break;
                case 1:
                    translateGT(next, langSource[sourceLanguage].code, langTo[targetLanguage].code)
                        .then(final => {
                            invoke("send_message", { msg: `${final} (${next})` })

                            text = final

                            setTranslated(final)
                        }).catch(e => {
                            setTranslated(e)
                        })

                    break;
            }

            await new Promise(r => setTimeout(r, calculateMinWaitTime(text)));
            setUpdateQueue(!updateQueue)
        })();
    }, [detectionQueue[0]])

    React.useEffect(() => {
        sr.lang = langSource[sourceLanguage].code

        if ((sourceLanguage == 0 || sourceLanguage == 1) && targetLanguage == 0) {
            setTargetLanguage(2)
        } else if (sourceLanguage - 1 == targetLanguage) {
            setTargetLanguage(0)
        }

        localStorage.setItem("sourceLanguage", sourceLanguage)

        sr.stop()
    }, [sourceLanguage])

    React.useEffect(() => {
        if ((sourceLanguage == 0 || sourceLanguage == 1) && targetLanguage == 0) {
            setSourceLanguage(2)
        } else if (sourceLanguage - 1 == targetLanguage) {
            setSourceLanguage(0)
        }

        localStorage.setItem("targetLanguage", targetLanguage)
    }, [targetLanguage])

    React.useEffect(() => {
        if (!detecting && detection.length != 0) {
            if (ovr) {
                invoke("send_ovr", { data: detection })

                return;
            }

            if (vrc) {
                setDetectionQueue([...detectionQueue, detection])
            }
        }
    }, [detecting, detection])

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
                {langSource.map((element, i) => {
                    return <MenuItem key={element.code} value={i}>{element.name}</MenuItem>
                })}
            </Select>
            <Select className="ml-4" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
                {langTo.map((element, i) => {
                    return <MenuItem key={element.code} value={i}>{element.name}</MenuItem>
                })}
            </Select>
        </div>
    </>
}