/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react"

import { Select, MenuItem, Button } from "@mui/material"

import {
    info,
    error,
    warn
} from '@tauri-apps/plugin-log';

import {
    X as XIcon,
    GitHub as GitHubIcon,
    SwapHoriz as SwapHorizIcon,
    Favorite as FavoriteIcon,
    KeyboardVoice as KeyboardVoiceIcon,
    PlayArrow as PlayArrowIcon,
    Pause as PauseIcon

} from '@mui/icons-material';

import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-shell'

import { calculateMinWaitTime, Lang, langSource, langTo } from "../util/constants"

import { Config } from "../util/config";
import { Recognizer } from "../recognizers/recognizer";
import { WebSpeech } from "../recognizers/WebSpeech";

import { localization } from "../util/localization";
import translateGT from "../translators/google_translate";
import translateGE from "../translators/gemini";
import { Gemini } from "../recognizers/Gemini";

type KikitanProps = {
    config: Config;
    setConfig: (config: Config) => void;
    lang: Lang;
}

let sr: Recognizer | null = null;
let detectionQueue: string[] = []
let lock = false

export default function Kikitan({ config, setConfig, lang }: KikitanProps) {
    const [detecting, setDetecting] = React.useState(false)
    const [translating, setTranslating] = React.useState(false)
    const [srStatus, setSRStatus] = React.useState(true)
    const [vrcMuted, setVRCMuted] = React.useState(false)

    const [detection, setDetection] = React.useState("")
    const [translated, setTranslated] = React.useState("")

    const [defaultMicrophone, setDefaultMicrophone] = React.useState(localization.waiting_for_mic_access[lang])
    const [lastDefaultMicrophone, setLastDefaultMicrophone] = React.useState("")

    const [triggerUpdate, setTriggerUpdate] = React.useState(false)

    const [sourceLanguage, setSourceLanguage] = React.useState(config.source_language)
    const [targetLanguage, setTargetLanguage] = React.useState(config.target_language)

    React.useEffect(() => {
        info(`[LANGUAGE] Changing language (${sourceLanguage} - ${targetLanguage}) - sr=${sr != null}`)

        if (sr) {
            sr.set_lang(sourceLanguage)
        }
    }, [sourceLanguage, targetLanguage])

    React.useEffect(() => {
        info(`[SR] SR status=${srStatus} - VRC Muted=${vrcMuted} - Disable Kikitan When Muted=${config.vrchat_settings.disable_kikitan_when_muted}`)

        if (sr == null) {
            warn("[SR] SR is currently null, so ignoring the changes")

            return
        }

        if (srStatus) {
            if (vrcMuted && config.vrchat_settings.disable_kikitan_when_muted) {
                info("[SR] Pausing SR...")
                sr.stop()
            }
            else if (!sr.status()) {
                info("[SR] Starting SR...")
                sr.start()
            }
        }
        else {
            info("[SR] Stopping SR...")
            sr.stop()
        }
    }, [srStatus, vrcMuted])

    React.useEffect(() => {
        (async () => {
            if (detectionQueue.length == 0 || lock) return;

            const val = detectionQueue[0].replace(/%/g, "%25")
            detectionQueue = detectionQueue.slice(1)

            lock = true

            info(`[TRANSLATION] Starting translation. Current detection queue length is ${detectionQueue.length}`)

            invoke("send_typing", { address: config.vrchat_settings.osc_address, port: `${config.vrchat_settings.osc_port}` })
            let count = 3;

            while (count > 0) {
                info(`[TRANSLATION] Attempting translation - Try ${4 - count}`)
                try {
                    setTranslating(true)
                    let text = config.gemini_settings.gemini_enabled ? val.split(" ~|~ ")[1] : await translateGT(val, sourceLanguage, targetLanguage);
                    info("[TRANSLATION] Translation succeeded!")

                    if (config.language_settings.english_gender_change && targetLanguage == "en") {
                        info("[TRANSLATION] Applying pronoun changes...")

                        if (config.language_settings.english_gender_change_gender == 0) text = text.replace(/\bshe\b/g, "he").replace(/\bShe\b/g, "He").replace(/\bher\b/g, "him").replace(/\bHer\b/g, "Him")
                        else text = text.replace(/\bhe\b/g, "she").replace(/\bHe\b/g, "She").replace(/\bhis\b/g, "her").replace(/\bHis\b/g, "Her").replace(/\bhim\b/g, "her").replace(/\bHim\b/g, "Her").replace(/\bhe's\b/g, "she's").replace(/\bHe's\b/g, "She's")
                    }

                    setTranslated(text)
                    setTranslating(false)

                    info("[TRANSLATION] Sending the message to chatbox...")
                    invoke("send_message", { address: config.vrchat_settings.osc_address, port: `${config.vrchat_settings.osc_port}`, msg: config.vrchat_settings.only_translation ? text : config.vrchat_settings.translation_first ? `${text} (${val})` : `${val} (${text})` })
                    await new Promise(r => setTimeout(r, calculateMinWaitTime(text, config.vrchat_settings.chatbox_update_speed)));

                    count = 0
                } catch (e) {
                    error(`[TRANSLATION] An error occured while trying to translate: ${e}`)

                    count--
                }
            }

            lock = false
        })();

        setTimeout(() => {
            setTriggerUpdate(!triggerUpdate)
        }, 100);
    }, [triggerUpdate])

    React.useEffect(() => {
        listen<boolean>("vrchat-mute", (event) => {
            info(`[OSC] Received mute status ${event.payload}`)
            setVRCMuted(event.payload)
        })

        if (sr == null) {
            info(`[SR] Initializing SR...`)
            setInterval(() => {
                navigator.mediaDevices.enumerateDevices()
                    .then(function (devices) {
                        let def = devices.filter((device) => device.kind == "audioinput")[0].label
                        def = def.split("(")[1].split(")")[0]

                        setDefaultMicrophone(def)
                    }).catch(function (err) {
                        error(`[MEDIA] Error while trying to pull the media devices: ${err.name + " " + err.message}`)
                    });
            }, 1000)

            if (!config.gemini_settings.gemini_enabled) {
                sr = new WebSpeech(sourceLanguage)
                info("[SR] Using WebSpeech for recognition")

                sr.onResult((result: string, isFinal: boolean) => {
                    info(`[SR] Received recognition result: Final: ${isFinal} - Result Length: ${result.length}`)
                    if (config.mode == 1 || config.vrchat_settings.send_typing_status_while_talking) invoke("send_typing", { address: config.vrchat_settings.osc_address, port: `${config.vrchat_settings.osc_port}` })

                    setDetection(result)
                    setDetecting(!isFinal)
                })
            } else {
                sr = new Gemini(sourceLanguage, targetLanguage, config.gemini_settings.gemini_api_key)
                info("[SR] Using Gemini for recognition")

                sr.onResult((result: string, isFinal: boolean) => {
                    info(`[GEMINI SR] Received gemini result: Result Length: ${result.length}`)
                    const data = JSON.parse(result)

                    setDetection(data.transcription + " ~|~ " + data.translation)
                })
            }



            info("[SR] Starting recognition")
            sr?.start()
        }
    }, [])

    React.useEffect(() => {
        if (defaultMicrophone == localization.waiting_for_mic_access[lang]) return;
        info("[MEDIA] Updating current microphone to " + defaultMicrophone)

        if (lastDefaultMicrophone == "") {
            setLastDefaultMicrophone(defaultMicrophone)

            return;
        }

        if (lastDefaultMicrophone == defaultMicrophone) return;

        window.location.reload()
    }, [defaultMicrophone])

    React.useEffect(() => {
        info(`[DETECTION] Detection status: Detecting: ${detecting} - Detection Length: ${detection.length}`)

        if (!detecting && detection.length != 0) {
            if (config.mode == 0) {
                detectionQueue = [...detectionQueue, (sourceLanguage == "ja" && config.language_settings.japanese_omit_questionmark) ? detection.replace(/？/g, "") : detection]

                info(`[DETECTION] Pushed the detection into the queue. Current queue length is ${detectionQueue.length}`)

                return
            }

            info(`[DETECTION] Sending the detection to chatbox...`)
            invoke("send_message", { address: config.vrchat_settings.osc_address, port: `${config.vrchat_settings.osc_port}`, msg: (sourceLanguage == "ja" && config.language_settings.japanese_omit_questionmark) ? detection.replace(/？/g, "") : detection })
        }
    }, [detecting, detection])

    return <>
        <div className="flex align-middle">
            <div>
                <div className={`mr-16 w-96 h-48 outline outline-1 transition-all rounded-md font-bold text-center ${detecting ? "italic " + config.light_mode ? "text-slate-400 outline-slate-800" : "text-slate-200 outline-slate-400" : config.light_mode ? "text-black" : "text-slate-200"} ${srStatus ? "" : "bg-gray-400"}`}>
                    <p className="align-middle">{config.gemini_settings.gemini_enabled ? detection.split(" ~|~")[0] : detection}</p>
                </div>
                <div className="flex">
                    <Select sx={{
                        color: config.light_mode ? 'black' : 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: config.light_mode ? 'black' : '#94A3B8',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: config.light_mode ? 'black' : '#94A3B8',
                        },
                        "& .MuiSvgIcon-root": {
                            color: config.light_mode ? 'black' : '#94A3B8'
                        },
                        "&.Mui-disabled": {
                            color: config.light_mode ? 'black' : 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: config.light_mode ? 'black' : '#94A3B8',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: config.light_mode ? 'black' : '#94A3B8',
                            },
                            "& .MuiSvgIcon-root": {
                                color: config.light_mode ? 'black' : '#94A3B8'
                            },
                        },
                    }} MenuProps={{
                        sx: {
                            "& .MuiPaper-root": {
                                backgroundColor: config.light_mode ? '#94A3B8' : '#020617',
                            }
                        }
                    }} className="mt-4 ml-auto h-14" value={sourceLanguage} onChange={(e) => {
                        setSourceLanguage(e.target.value)
                        setConfig({ ...config, source_language: e.target.value })
                    }}>
                        {langSource.map((element) => {
                            return <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} key={element.code} value={element.code}>{element.name[lang]}</MenuItem>
                        })}
                    </Select>
                    <div className="mt-7">
                        <Button onClick={() => {
                            const new_t = sourceLanguage.includes("en-") ? "en" : sourceLanguage.includes("es-") ? "es" : sourceLanguage
                            const new_s = targetLanguage == "en" ? "en-US" : targetLanguage == "es" ? "es-ES" : targetLanguage

                            setTargetLanguage(new_t)
                            setSourceLanguage(new_s)

                            setConfig({ ...config, source_language: new_s, target_language: new_t })
                        }}>
                            <SwapHorizIcon />
                        </Button>
                    </div>
                </div>
            </div>
            <div>
                <div className={`w-96 h-48 outline outline-1 transition-all rounded-md ${config.light_mode ? "text-black outline-slate-800" : "text-slate-200 outline-slate-400"} font-bold text-center ${srStatus ? "" : "bg-gray-400"}`}>
                    <p className={`transition-all duration-300 align-middle ${translating ? "opacity-0" : "opacity-100"}`}>{translated}</p>
                </div>
                <div>
                    <Select sx={{
                        color: config.light_mode ? 'black' : 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: config.light_mode ? 'black' : '#94A3B8',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: config.light_mode ? 'black' : '#94A3B8',
                        },
                        "& .MuiSvgIcon-root": {
                            color: config.light_mode ? 'black' : '#94A3B8'
                        }
                    }} MenuProps={{
                        sx: {
                            "& .MuiPaper-root": {
                                backgroundColor: config.light_mode ? '#94A3B8' : '#020617',
                            }
                        }
                    }} className="mt-4" value={targetLanguage} onChange={(e) => {
                        setTargetLanguage(e.target.value)

                        setConfig({ ...config, target_language: e.target.value })
                    }}>
                        {langTo.map((element) => {
                            return <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} key={element.code} value={element.code}>{element.name[lang]}</MenuItem>
                        })}
                    </Select>
                </div>
            </div>
        </div>
        <div className="mt-2 mb-2">
            <Button variant="outlined" size="medium" color={srStatus ? "error" : "success"} onClick={() => { setSRStatus(!srStatus) }}><p>{!srStatus ? localization.start[lang] : localization.stop[lang]}</p> {srStatus ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}</Button>
        </div>
        <div>
            <KeyboardVoiceIcon fontSize="small" /><a className=" text-blue-700" href="" onClick={(e) => {
                e.preventDefault()

                invoke("show_windows_audio_settings")
            }}>{defaultMicrophone}</a>
        </div>
        <div className="align-middle">
            <div className="mt-2 flex space-x-2">
                <Button variant="contained" size="small" className="h-8" onClick={() => { open("https://twitter.com/marquina_osu") }}><XIcon fontSize="small" /></Button>
                <Button variant="contained" size="small" className="h-8" onClick={() => { open("https://buymeacoffee.com/sergiomarquina") }}><FavoriteIcon fontSize="small" /></Button>
                <Button variant="contained" size="small" className="h-8" onClick={() => { open("https://github.com/YusufOzmen01/kikitan-translator") }}><GitHubIcon fontSize="small" /></Button>
            </div>
        </div>
    </>
}