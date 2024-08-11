'use client'

import * as React from "react"

import { Select, MenuItem, Button } from "@mui/material"

import {
    X as XIcon,
    GitHub as GitHubIcon,
    SwapHoriz as SwapHorizIcon,
    Favorite as FavoriteIcon
} from '@mui/icons-material';

import { invoke } from '@tauri-apps/api/tauri'
import { open } from '@tauri-apps/api/shell'

import { calculateMinWaitTime, langSource, langTo } from "../util/constants"
import { default as translateGT } from '../translators/google_translate';

var sr = null

export default function Kikitan({ sr_on, ovr, vrc, config, setConfig, ws }) {
    const [detecting, setDetecting] = React.useState(true)
    const [detection, setDetection] = React.useState("")
    const [detectionQueue, setDetectionQueue] = React.useState([])
    const [translated, setTranslated] = React.useState("")

    const [sourceLanguage, setSourceLanguage] = React.useState(config.source_language)
    const [targetLanguage, setTargetLanguage] = React.useState(config.target_language)

    const [restartSRTick, setRestartSRTick] = React.useState(false)
    const [updateQueueTick, setUpdateQueueTick] = React.useState(false)

    React.useEffect(() => {
        const new_queue = detectionQueue.slice(1)

        setDetectionQueue(new_queue)
    }, [updateQueueTick])

    React.useEffect(() => {
        if (sr_on) {
            try {
                sr.start()
            } catch { }
        }

        setTimeout(() => {
            setRestartSRTick(!restartSRTick)
        }, 200)
    }, [restartSRTick])

    React.useEffect(() => {
        sr = new window.webkitSpeechRecognition();
        sr.lang = langSource[sourceLanguage].code
        sr.interimResults = true
        sr.maxAlternatives = 1
        sr.continuous = true

        sr.onerror = console.log

        sr.onresult = (res => {
            if (!sr_on) return;
            if (config.mode == 1 || config.vrchat_settings.send_typing_while_talking) invoke("send_typing", {})

            if (res.results[res.results.length - 1][0].transcript.trim().length == 0) return;

            setDetection(res.results[res.results.length - 1][0].transcript.trim())
            setDetecting(!res.results[res.results.length - 1].isFinal)
        })

        sr.start();

        setRestartSRTick(!restartSRTick)
    }, [sr_on])

    React.useEffect(() => {
        (async () => {
            if (detectionQueue.length == 0) return;

            const next = detectionQueue[0];

            invoke("send_typing", {})

            switch (config.translator) {
                case 0:
                    try {
                        let text = await translateGT(next, langSource[sourceLanguage].code, langTo[targetLanguage].code)

                        setTranslated(text)

                        invoke("send_message", { address: config.vrchat_settings.osc_address, port: `${config.vrchat_settings.osc_port}`, msg: config.vrchat_settings.translation_first ? `${text} (${next})` : `${next} (${text})` })

                        await new Promise(r => setTimeout(r, calculateMinWaitTime(text, config.vrchat_settings.chatbox_update_speed)));
                        setUpdateQueueTickTick(!updateQueueTick)
                    } catch {
                        setTranslated("Unable to translate. Maybe google translate is not accessible?")
                    }

                    break;
            }
        })();
    }, [detectionQueue[0]])

    React.useEffect(() => {
        if (!detecting && detection.length != 0) {
            if (ovr) {
                if (ws != null) ws.send(`send-${langSource[sourceLanguage].code == "ja" ? detection.replaceAll("？", "") : detection}`)

                return;
            }

            if (vrc) {
                if (config.mode == 0) {
                    setDetectionQueue([...detectionQueue, (langSource[sourceLanguage].code == "ja" && config.language_settings.japanese_omit_questionmark) ? detection.replaceAll("？", "") : detection])

                    return
                }

                invoke("send_message", { address: config.vrchat_settings.osc_address, port: `${config.vrchat_settings.osc_port}`, msg: (langSource[sourceLanguage].code == "ja" && config.language_settings.japanese_omit_questionmark) ? detection.replaceAll("？", "") : detection })
            }
        }
    }, [detecting, detection])

    return <>
        <div className="flex align-middle">
            <div>
                <div className={`mr-16 w-96 h-48 outline outline-2 outline-slate-400 rounded-md font-bold text-center ${detecting ? "text-slate-700 italic" : "text-black"}`}>
                    <p className="align-middle">{detection}</p>
                </div>
                <div className="flex">
                    <Select className="mt-4 ml-auto h-14" value={sourceLanguage} onChange={(e) => {
                        sr.lang = langSource[e.target.value].code
                        sr.stop()

                        setSourceLanguage(e.target.value)
                        setConfig({ ...config, source_language: e.target.value })
                    }}>
                        {langSource.map((element, i) => {
                            return <MenuItem key={element.code} value={i}>{element.name}</MenuItem>
                        })}
                    </Select>
                    <div className="mt-7">
                        <Button onClick={() => {
                            let old_t = (sourceLanguage == 0) || (sourceLanguage == 1) ? 0 : sourceLanguage
                            let old_s = targetLanguage

                            sr.lang = langSource[old_s].code
                            sr.stop()

                            setTargetLanguage(old_t)
                            setSourceLanguage(old_s)

                            setConfig({ ...config, source_language: old_s, target_language: old_t })
                        }}>
                            <SwapHorizIcon />
                        </Button>
                    </div>
                </div>
            </div>

            <div>
                <div className="w-96 h-48 outline outline-2 outline-slate-400 rounded-md text-black font-bold text-center">
                    <p className="align-middle">{translated}</p>
                </div>
                <div>
                    <Select className="mt-4" value={targetLanguage} onChange={(e) => {
                        setTargetLanguage(e.target.value)
                        setConfig({ ...config, target_language: e.target.value })
                    }}>
                        {(() => {
                            let m = langTo.map((element, i) => {
                                return {
                                    e: element,
                                    i
                                }
                            })

                            m = m.filter((element, i) => {
                                return m.findIndex((e) => e.e.code == element.e.code) == i
                            })

                            return m.map((element) => {
                                return <MenuItem key={element.e.code} value={element.i}>{element.e.name}</MenuItem>
                            })
                                
                        })()}
                    </Select>
                </div>
            </div>
        </div>
        <div className="align-middle mt-2">
            <div className="mt-14 flex space-x-2">
                <Button variant="contained" size="small" className="h-8" onClick={() => { open("https://twitter.com/marquina_osu") }}><XIcon fontSize="small" /></Button>
                <Button variant="contained" size="small" className="h-8" onClick={() => { open("https://github.com/sponsors/YusufOzmen01") }}><FavoriteIcon fontSize="small" /></Button>
                <Button variant="contained" size="small" className="h-8" onClick={() => { open("https://github.com/YusufOzmen01/kikitan-translator") }}><GitHubIcon fontSize="small" /></Button>
            </div>
        </div>
    </>
}