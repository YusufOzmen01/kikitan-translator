import * as React from "react"

import { Select, MenuItem, Button } from "@mui/material"

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
import { open } from '@tauri-apps/plugin-shell'

import { calculateMinWaitTime, Lang, langSource, langTo } from "../util/constants"

import { Config } from "../util/config";
import { Recognizer } from "../recognizers/recognizer";
import { WebSpeech } from "../recognizers/WebSpeech";

import { localization } from "../util/localization";
import translateGT from "../translators/google_translate";

type KikitanProps = {
    config: Config;
    setConfig: (config: Config) => void;
    lang: Lang;
}

let sr: Recognizer | null = null;
let detectionQueue: string[] = []
let lock = false

export default function Kikitan({ config, setConfig, lang }: KikitanProps) {
    const [detecting, setDetecting] = React.useState(true)
    const [srStatus, setSRStatus] = React.useState(true)

    const [detection, setDetection] = React.useState("")
    const [translated, setTranslated] = React.useState("")

    const [defaultMicrophone, setDefaultMicrophone] = React.useState(localization.waiting_for_mic_access[lang])
    const [lastDefaultMicrophone, setLastDefaultMicrophone] = React.useState("")

    const [triggerUpdate, setTriggerUpdate] = React.useState(false)

    const [sourceLanguage, setSourceLanguage] = React.useState(config.source_language)
    const [targetLanguage, setTargetLanguage] = React.useState(config.target_language)

    React.useEffect(() => {
        if (sr) {
            sr.set_lang(sourceLanguage)
        }
    }, [sourceLanguage, targetLanguage])

    React.useEffect(() => {
        if (sr == null) {
            return
        }

        if (srStatus) sr.start()
        else sr.stop()
    }, [srStatus])

    React.useEffect(() => {
        (async () => {
            if (detectionQueue.length == 0 || lock) return;

            console.log(config.language_settings.english_gender_change_gender)

            const val = detectionQueue[0].replace(/%/g, "%25")
            detectionQueue = detectionQueue.slice(1)

            lock = true

            invoke("send_typing", { address: config.vrchat_settings.osc_address, port: `${config.vrchat_settings.osc_port}` })
            let count = 3;

            while (count > 0) {
                try {
                    let text = await translateGT(val, sourceLanguage, targetLanguage)

                    if (config.language_settings.english_gender_change && targetLanguage == "en") {
                        if (config.language_settings.english_gender_change_gender == 0) text = text.replace(/\bshe\b/g, "he").replace(/\bShe\b/g, "He").replace(/\bher\b/g, "him").replace(/\bHer\b/g, "Him")
                        else text = text.replace(/\bhe\b/g, "she").replace(/\bHe\b/g, "She").replace(/\bhis\b/g, "her").replace(/\bHis\b/g, "Her").replace(/\bhim\b/g, "her").replace(/\bHim\b/g, "Her").replace(/\bhe's\b/g, "she's").replace(/\bHe's\b/g, "She's")
                    }

                    setTranslated(text)

                    invoke("send_message", { address: config.vrchat_settings.osc_address, port: `${config.vrchat_settings.osc_port}`, msg: config.vrchat_settings.translation_first ? `${text} (${val})` : `${val} (${text})` })
                    await new Promise(r => setTimeout(r, calculateMinWaitTime(text, config.vrchat_settings.chatbox_update_speed)));

                    count = 0
                } catch (e) {
                    console.log(e)

                    count--
                }

                break;
            }

            lock = false
        })();

        setTimeout(() => {
            setTriggerUpdate(!triggerUpdate)
        }, 100);
    }, [triggerUpdate])

    React.useEffect(() => {
        if (sr == null) {
            setInterval(() => {
                navigator.mediaDevices.enumerateDevices()
                    .then(function (devices) {
                        let def = devices.filter((device) => device.kind == "audioinput")[0].label
                        def = def.split("(")[1].split(")")[0]

                        setDefaultMicrophone(def)
                    }).catch(function (err) {
                        console.log(err.name + ": " + err.message);
                    });
            }, 1000)

            sr = new WebSpeech(sourceLanguage)

            sr.onResult((result: string, isFinal: boolean) => {
                if (config.mode == 1 || config.vrchat_settings.send_typing_while_talking) invoke("send_typing", { address: config.vrchat_settings.osc_address, port: `${config.vrchat_settings.osc_port}` })

                setDetection(result)
                setDetecting(!isFinal)
            })

            sr.start()
        }
    }, [])

    React.useEffect(() => {
        if (defaultMicrophone == localization.waiting_for_mic_access[lang]) return;
        console.log("Default microphone is not empty")

        if (lastDefaultMicrophone == "") {
            setLastDefaultMicrophone(defaultMicrophone)

            return;
        }

        console.log("Last default microphone is not empty")

        if (lastDefaultMicrophone == defaultMicrophone) return;

        window.location.reload()
    }, [defaultMicrophone])

    React.useEffect(() => {
        if (!detecting && detection.length != 0) {
            if (config.mode == 0) {
                detectionQueue = [...detectionQueue, (sourceLanguage == "ja" && config.language_settings.japanese_omit_questionmark) ? detection.replace(/？/g, "") : detection]

                return
            }

            invoke("send_message", { address: config.vrchat_settings.osc_address, port: `${config.vrchat_settings.osc_port}`, msg: (sourceLanguage == "ja" && config.language_settings.japanese_omit_questionmark) ? detection.replace(/？/g, "") : detection })
        }
    }, [detecting, detection])

    return <>
        <div className="flex align-middle">
            <div>
                <div className={`mr-16 w-96 h-48 outline outline-2 transition-all outline-slate-400 rounded-md font-bold text-center ${detecting ? "text-slate-700 italic" : "text-black"} ${srStatus ? "" : "bg-gray-400"}`}>
                    <p className="align-middle">{detection}</p>
                </div>
                <div className="flex">
                    <Select className="mt-4 ml-auto h-14" value={sourceLanguage} onChange={(e) => {
                        setSourceLanguage(e.target.value)
                        setConfig({ ...config, source_language: e.target.value })
                    }}>
                        {langSource.map((element) => {
                            return <MenuItem key={element.code} value={element.code}>{element.name[lang]}</MenuItem>
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
                <div className={`w-96 h-48 outline outline-2 transition-all outline-slate-400 rounded-md text-black font-bold text-center ${srStatus ? "" : "bg-gray-400"}`}>
                    <p className="align-middle">{translated}</p>
                </div>
                <div>
                    <Select className="mt-4" value={targetLanguage} onChange={(e) => {
                        setTargetLanguage(e.target.value)

                        setConfig({ ...config, target_language: e.target.value })
                    }}>
                        {langTo.map((element) => {
                            return <MenuItem key={element.code} value={element.code}>{element.name[lang]}</MenuItem>
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