/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react"

import { Select, MenuItem, Button, TextField } from "@mui/material"

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
    Pause as PauseIcon,
    Keyboard

} from '@mui/icons-material';

import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-shell'

import { calculateMinWaitTime, Lang, langSource, langTo } from "../util/constants"

import { Config } from "../util/config";
import { Recognizer } from "../recognizers/recognizer";
import { WebSpeech } from "../recognizers/WebSpeech";

import { localization } from "../util/localization";
import { Gemini, GeminiState } from "../recognizers/Gemini";

type KikitanProps = {
    config: Config,
    setConfig: (config: Config) => void,
    setSettingsVisible: (state: boolean) => void,
    lang: Lang,
    settingsVisible: boolean
}

let sr: Recognizer | null = null;
let detectionQueue: string[][] = []
let lock = false

export default function Kikitan({ config, setConfig, lang, settingsVisible, setSettingsVisible }: KikitanProps) {
    const [detecting, setDetecting] = React.useState(false)
    const [srStatus, setSRStatus] = React.useState(true)
    const [vrcMuted, setVRCMuted] = React.useState(false)

    const [detection, setDetection] = React.useState<string>("")
    const [translated, setTranslated] = React.useState("")

    const [defaultMicrophone, setDefaultMicrophone] = React.useState(localization.waiting_for_mic_access[lang])
    const [lastDefaultMicrophone, setLastDefaultMicrophone] = React.useState("")

    const [triggerUpdate, setTriggerUpdate] = React.useState(false)

    const [sourceLanguage, setSourceLanguage] = React.useState(config.source_language)
    const [targetLanguage, setTargetLanguage] = React.useState(config.target_language)

    const [geminiStatus, setGeminiStatus] = React.useState<GeminiState>();
    const [geminiInterval, setGeminiInterval] = React.useState<NodeJS.Timeout | null>(null)

    const [textInputVisible, setTextInputVisible] = React.useState(false)
    const [textInputValue, setTextInputValue] = React.useState("")

    const textInputRef = React.useRef<HTMLInputElement>(null)

    const setGeminiAsSR = () => {
        sr = new Gemini(sourceLanguage, targetLanguage, config.gemini_settings.gemini_api_key, !config.gemini_settings.gemini_enable_transcription, config.language_settings.japanese_omit_questionmark)
        info("[SR] Using Gemini for recognition")

        setGeminiInterval(setInterval(() => {
            setGeminiStatus(sr?.status() as GeminiState)
        }, 100))

        sr.onResult((result: string[], isFinal: boolean) => {
            setDetection(result[0])
            setDetecting(!isFinal)

            if (isFinal) {
                detectionQueue = [...detectionQueue, result]

                info(`[QUEUE] Updating queue. Current queue length: ${detectionQueue.length}`)
            }
        })
    }

    const restartSR = () => {
        sr?.stop();
        if (geminiInterval != null) {
            clearInterval(geminiInterval)
            setGeminiInterval(null)
            setGeminiStatus(GeminiState.NOT_CONNECTED)
        }

        info(`[SR] Initializing SR...`)

        if (!config.gemini_settings.gemini_enabled) {
            sr = new WebSpeech(sourceLanguage, targetLanguage)
            info("[SR] Using WebSpeech for recognition")

            sr.onResult((result: string[], isFinal: boolean) => {
                if (config.mode == 1 || config.vrchat_settings.send_typing_status_while_talking) invoke("send_typing", { address: config.vrchat_settings.osc_address, port: `${config.vrchat_settings.osc_port}` })
                
                if (isFinal) {
                    info(`[QUEUE] Updating queue. Current queue length: ${detectionQueue.length}`)

                    detectionQueue = [...detectionQueue, result]
                }

                setDetection(result[0])
                setDetecting(!isFinal)
            })
        } else setGeminiAsSR()

        info("[SR] Starting recognition")
        sr?.start()
    }

    React.useEffect(() => {
        info(`[LANGUAGE] Changing language (${sourceLanguage} - ${targetLanguage}) - sr=${sr != null}`)

        if (sr) {
            sr.set_lang(sourceLanguage, targetLanguage);

            sr?.stop()
            setGeminiAsSR()
            sr?.start()
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
            else {
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

            const current = detectionQueue[0]
            detectionQueue = detectionQueue.slice(1)

            lock = true

            info(`[QUEUE] Processing the queue. Current queue length: ${detectionQueue.length}`)

            const current_detection = current[0]
            const current_translation = current[1]

            setTranslated(current_translation)

            info("[TRANSLATION] Sending the message to chatbox...")
            invoke("send_message", { address: config.vrchat_settings.osc_address, port: `${config.vrchat_settings.osc_port}`, msg: config.vrchat_settings.only_translation ? current_translation : config.vrchat_settings.translation_first ? `${current_translation} (${current_detection})` : `${current_detection} (${current_translation})` })
            await new Promise(r => setTimeout(r, calculateMinWaitTime(current_translation, config.vrchat_settings.chatbox_update_speed)));

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

            restartSR();
        }
    }, [])

    React.useEffect(() => {
        if (settingsVisible == false && defaultMicrophone != localization.waiting_for_mic_access[lang]) restartSR()
    }, [settingsVisible])

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

    return <>
        <div className="relative transition-all">
            <div className={'transition-all z-30 w-full h-64 flex bg-transparent justify-center items-center absolute' + (textInputVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
                <div className={`flex flex-col justify-center w-4/12 h-2/6 outline outline-1 ${config.light_mode ? "outline-white" : "outline-slate-900"} rounded ${config.light_mode ? "bg-white" : "bg-slate-950"}`}>
                    <div className='flex flex-row justify-center gap-2'>
                        <TextField slotProps={{
                            inputLabel: {
                                style: { color: config.light_mode ? "black" : '#94A3B8' }
                            },
                            htmlInput: {
                                style: { color: config.light_mode ? "black" : '#fff' }
                            }
                        }} inputRef={textInputRef} placeholder={localization.type_here[lang]} className="mt-2 w-48" value={textInputValue} id="outlined-basic" variant="outlined" onKeyDown={(e) => {
                            if (e.key == "Enter") {
                                sr?.manual_trigger(textInputValue)

                                setTextInputVisible(false)
                                setTextInputValue("")
                            }
                        }} onChange={(e) => {
                            setTextInputValue(e.target.value)
                        }} />
                        <Button variant="contained" className='w-48' onClick={() => { setTextInputVisible(false); setTextInputValue("") }}>{localization.close_menu[lang]}</Button>
                    </div>
                </div>
            </div>
            <div className="z-10 flex align-middle">
                <div>
                    <div className={`mr-16 w-96 h-48 outline outline-1 transition-all rounded-md font-bold text-center ${detecting ? "italic " + config.light_mode ? "text-slate-400 outline-slate-800" : "text-slate-200 outline-slate-400" : config.light_mode ? "text-black" : "text-slate-200"} ${srStatus ? "" : "bg-gray-400"}`}>
                        <p className="align-middle">{detection}</p>
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
                        <p className={`transition-all duration-300 align-middle`}>{translated}</p>
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
        </div>
        <div className="mt-2 mb-2 flex gap-2">
            <Button variant="outlined" size="medium" disabled={!srStatus} onClick={() => { if (!textInputVisible) { textInputRef.current?.focus(); textInputRef.current?.select() } setTextInputVisible(!textInputVisible); }}><p>{localization.text[lang]}</p> {<Keyboard className="ml-2" fontSize="small" />}</Button>
            <Button variant="outlined" size="medium" color={srStatus ? "error" : "success"} onClick={() => { setSRStatus(!srStatus) }}><p>{!srStatus ? localization.start[lang] : localization.stop[lang]}</p> {srStatus ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}</Button>
        </div>
        <div>
            <KeyboardVoiceIcon fontSize="small" /><a className=" text-blue-700" href="" onClick={(e) => {
                e.preventDefault()

                invoke("show_audio_settings")
            }}>{defaultMicrophone}</a>
        </div>
        <div className="align-middle">
            <div className="mt-2 flex space-x-2 justify-center">
                <Button variant="contained" size="small" className="h-8" onClick={() => { open("https://twitter.com/marquina_osu") }}><XIcon fontSize="small" /></Button>
                <Button variant="contained" size="small" className="h-8" onClick={() => { open("https://buymeacoffee.com/sergiomarquina") }}><FavoriteIcon fontSize="small" /></Button>
                <Button variant="contained" size="small" className="h-8" onClick={() => { open("https://github.com/YusufOzmen01/kikitan-translator") }}><GitHubIcon fontSize="small" /></Button>
                <Button variant="contained" size="small" className="h-8" onClick={() => { open("https://discord.gg/jpkYCgpBGV") }}><img src="/discordlogo.webp" className={config.light_mode ? "" : "invert"} width={18} /></Button>

            </div>
            <div className="mt-2 text-md flex justify-center gap-1">
                {config.gemini_settings.gemini_enabled && <>
                    {geminiStatus == GeminiState.NOT_CONNECTED && <p className="text-slate-400 italic">{localization.gemini_not_connected[lang]}</p>}
                    {geminiStatus == GeminiState.AUTH_FAILED && <p className="text-red-600">{localization.invalid_gemini_api_key[lang]}</p>}
                    {geminiStatus == GeminiState.WS_CONNECTED && <p className="text-yellow-600">{localization.waiting_for_gemini_setup[lang]}</p>}
                    {geminiStatus == GeminiState.RECOGNITION_STARTED && <p className="text-green-700">{localization.gemini_is_ready[lang]}</p>}
                    {geminiStatus == GeminiState.RATE_LIMIT && <p className="text-yellow-400">{localization.gemini_rate_limit[lang]}</p>}
                </>}
                {!config.gemini_settings.gemini_enabled && <>
                    <p className="text-center">{localization.gemini_is_disabled[lang]}</p>
                    <a href="" className="italic text-slate-500" onClick={(e) => { e.preventDefault(); setSettingsVisible(true); }}>{localization.settings[lang]}</a>
                </>}
            </div>
        </div>
    </>
}