import * as React from "react"
import { Config } from "../util/config"

import {
    GitHub,
    Settings,
    Translate
} from '@mui/icons-material';

import Scroll from "./Scroll"
import { localization } from "../util/localization";
import { Box, Button, Checkbox, FormControlLabel, FormGroup, MenuItem, Select } from "@mui/material";
import { Lang } from "../util/constants";
import { invoke } from "@tauri-apps/api/core";

type QuickstartMenuProps = {
    config: Config,
    setLang: (value: React.SetStateAction<Lang>) => void,
    setConfig: (value: React.SetStateAction<Config>) => void,
    lang: Lang
}

export default function QuickstartMenu({ config, setLang, lang, setConfig }: QuickstartMenuProps) {
    const [quickstartPage, setQuickstartPage] = React.useState(0)
    // const [geminiTutorialShow, setGeminiTutorialShow] = React.useState(false)

    return <>
        <div className={`absolute z-10 flex flex-col justify-between w-10/12 h-5/6 outline outline-2 rounded  ${!config.light_mode ? "bg-slate-950 outline-slate-950" : "bg-white outline-white"}`}>
            <div className='relative mt-2 ml-2 mr-2 h-64'>
                <div className={`absolute inset-0 transition-all flex justify-center ease-in-out ${quickstartPage == 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                    <div className='absolute mt-28 flex flex-col items-center'>
                        <Scroll light_mode={config.light_mode}></Scroll>

                        <div className='mt-16 absolute flex flex-row items-center'>
                            <Translate className='mr-8 outline-2 ' />
                            <Select sx={{
                                color: config.light_mode ? 'black' : 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: config.light_mode ? 'black' : 'white',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: config.light_mode ? 'black' : 'white',
                                },
                            }} variant='outlined' className="mt-auto mr-8" value={lang} onChange={(e) => {
                                setLang(e.target.value as Lang)
                            }}>

                                <MenuItem value={"en"}>English</MenuItem>
                                <MenuItem value={"jp"}>日本語</MenuItem>
                                <MenuItem value={"cn"}>中文</MenuItem>
                                <MenuItem value={"kr"}>한국어</MenuItem>
                                <MenuItem value={"tr"}>Türkçe</MenuItem>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className={'absolute inset-0 transition-all flex justify-center ease-in-out ' + (quickstartPage == 1 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                    <div className='absolute mt-2 flex flex-col items-center'>
                        <p className='text-xl bold text-center'>{localization.quickstart_osc[lang]}</p>
                        {quickstartPage == 1 &&
                            <video width={480} autoPlay loop className='mt-4'>
                                <source src="/OSC.mp4" type="video/mp4"></source>
                            </video>
                        }
                    </div>
                </div>

                {/* <div className={'absolute inset-0 transition-all flex justify-center ease-in-out ' + (quickstartPage == 2 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                    <div className='absolute mt-2 flex flex-col items-center'>
                        <p className='text-xl bold text-center'>{localization.how_to_setup_and_use_kikitan[lang]}</p>
                        {quickstartPage == 2 &&
                            <iframe
                                width="560"
                                height="315"
                                className="mt-4"
                                src="https://www.youtube-nocookie.com/embed/hB7CDrVnNCs"
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                {...({ credentialless: "" } as any)}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        }
                    </div>
                </div> */}

                <div className={'absolute inset-0 transition-all flex flex-col items-center justify-center ease-in-out ' + (quickstartPage == 2 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                    <div className='mt-2 mb-4'>
                        <p className='text-xl bold text-center'>{localization.windows_mic_settings[lang]}</p>
                        <p className='text-lg mt-20 text-center'>{localization.windows_mic_details[lang]}</p>
                    </div>
                    <Button disabled={quickstartPage != 2} className={'w-96 '} variant='contained' startIcon={<Settings />} onClick={() => { invoke("show_audio_settings") }}>{localization.open_win_audio[lang]}</Button>
                </div>

                <div className={'absolute inset-0 transition-all flex justify-center ease-in-out ' + (quickstartPage == 3 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                    <div className='absolute mt-2 flex flex-col items-center'>
                        <p className='text-xl bold text-center'>{localization.mode_selection[lang]}</p>
                        <img className='mt-4 w-[256px]' src={
                            {
                                en: "/mode_select_screenshots/en.png",
                                jp: "/mode_select_screenshots/jp.png",
                                cn: "/mode_select_screenshots/cn.png",
                                kr: "/mode_select_screenshots/kr.png",
                                tr: "/mode_select_screenshots/tr.png"
                            }[lang]
                        } width={240} />
                        <p className='text-md mt-4 text-center'>{localization.mode_selection_details[lang]}</p>
                    </div>
                </div>

                <Box sx={{
                    width: '100%',
                    '& .MuiSvgIcon-root': {
                        color: config.light_mode ? 'black' : '#94A3B8'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: config.light_mode ? 'black' : '#94A3B8',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: config.light_mode ? 'black' : '#94A3B8',
                    },
                    '& .MuiFormControlLabel-root.Mui-disabled .MuiFormControlLabel-label': {
                        color: config.light_mode ? '#666666' : '#4f4f4f'
                    }
                }} >
                    <div className={'absolute inset-0 transition-all space-y-2 flex flex-col items-center ease-in-out ' + (quickstartPage == 4 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                        <div className='mt-4 mb-4'>
                            <p className='text-4xl bold text-center'>{localization.change_basic_settings[lang]}</p>
                        </div>
                        <FormGroup>
                            <FormControlLabel control={<Checkbox checked={config.vrchat_settings.disable_kikitan_when_muted} onChange={(e) => {
                                setConfig({
                                    ...config,
                                    vrchat_settings: {
                                        ...config.vrchat_settings,
                                        disable_kikitan_when_muted: e.target.checked
                                    }
                                })
                            }} />} label={localization.disable_kikitan_when_muted[lang]} />
                            <FormControlLabel control={<Checkbox checked={config.vrchat_settings.translation_first} onChange={(e) => {
                                setConfig({
                                    ...config,
                                    vrchat_settings: {
                                        ...config.vrchat_settings,
                                        translation_first: e.target.checked
                                    }
                                })
                            }} />} label={localization.translation_first[lang]} />
                            <FormControlLabel control={<Checkbox checked={config.vrchat_settings.send_typing_status_while_talking} onChange={(e) => {
                                setConfig({
                                    ...config,
                                    vrchat_settings: {
                                        ...config.vrchat_settings,
                                        send_typing_status_while_talking: e.target.checked
                                    }
                                })
                            }} />} label={localization.send_typing_while_talking[lang]} />
                            <FormControlLabel control={<Checkbox checked={config.vrchat_settings.only_translation} onChange={(e) => {
                                setConfig({
                                    ...config,
                                    vrchat_settings: {
                                        ...config.vrchat_settings,
                                        only_translation: e.target.checked
                                    }
                                })
                            }} />} label={localization.only_send_translation[lang]} />
                        </FormGroup>
                    </div>

                    {/* <div className={'inset-0 transition-all space-y-2 flex flex-col items-center justify-center ease-in-out ' + (quickstartPage == 6 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                        <div className='mt-4'>
                            <p className='text-4xl bold text-center'>Google Gemini</p>
                            <p className='text-sm mt-2 text-center'>{localization.google_gemini_note[lang]}</p>
                        </div>
                        <FormGroup>
                            <FormControlLabel control={<Checkbox checked={config.gemini_settings.microphone_capture} onChange={(e) => {
                                setConfig({
                                    ...config,
                                    gemini_settings: {
                                        ...config.gemini_settings,
                                        microphone_capture: e.target.checked
                                    }
                                })
                            }} />} label={localization.enable_gemini_microphone_capture[lang]} />
                            <FormControlLabel control={<Checkbox checked={config.gemini_settings.desktop_capture} onChange={(e) => {
                                setConfig({
                                    ...config,
                                    gemini_settings: {
                                        ...config.gemini_settings,
                                        desktop_capture: e.target.checked
                                    }
                                })
                            }} />} label={localization.enable_desktop_capture[lang]} />
                            <div className="flex flex-row gap-2">
                                <TextField slotProps={{
                                    inputLabel: {
                                        style: { color: config.light_mode ? "black" : '#94A3B8' },
                                    },
                                    htmlInput: {
                                        style: { color: config.light_mode ? "black" : '#fff' }
                                    }
                                }} className="w-48 h-8" value={config.gemini_settings.gemini_api_key} id="outlined-basic" label={"Gemini API Key"} variant="outlined" type="password" onChange={(e) => {
                                    setConfig({
                                        ...config,
                                        gemini_settings: {
                                            ...config.gemini_settings,
                                            gemini_api_key: e.target.value
                                        }
                                    })
                                }} />
                                <Button variant="contained" color="success" className="h-14" onClick={async () => { invoke("open_url", { url: "https://aistudio.google.com/api-keys" }) }}>{localization.get_gemini_api_key[lang]}</Button>
                                <Button variant="contained" className="h-14" onClick={async () => { setGeminiTutorialShow(true) }}>{localization.gemini_api_key_tutorial[lang]}</Button>
                            </div>
                        </FormGroup>
                    </div> */}
                </Box>

                <div className={'absolute inset-0 transition-all space-y-2 flex flex-col items-center justify-center ease-in-out ' + (quickstartPage == 5 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                    <div className='mt-4 mb-4'>
                        <p className='text-xl mt-8 bold text-center'>{localization.thank_you[lang]}</p>
                        <p className='text-lg mt-20 text-center'>{localization.thank_you_details[lang]}</p>
                    </div>
                    <Button disabled={quickstartPage != 5} className={'w-70'} variant='contained' startIcon={< GitHub />} onClick={async () => { open("https://github.com/YusufOzmen01/kikitan-translator") }}>{localization.open_repo[lang]}</Button>
                    <div className="flex gap-2">
                        <Button sx={{
                            backgroundColor: "#ffde06",
                            color: "black"
                        }} disabled={quickstartPage != 5} variant="contained" className='w-52 h-9' onClick={() => { invoke("open_url", { url: "https://buymeacoffee.com/sergiomarquina" }) }}>
                            <img src="/buymeacoffeelogo.svg" width={36}></img>
                            <p className="mt-0.5">Buy Me a Coffee</p>
                        </Button>

                        <Button sx={{
                            backgroundColor: "#fc4d50"
                        }} disabled={quickstartPage != 5} variant="contained" className='w-52' onClick={() => { invoke("open_url", { url: "https://booth.pm/en/items/6073050" }) }}>
                            <img src="/boothlogo.svg" width={24} className="mr-2"></img>
                            <p className="mt-0.5">Booth.pm</p>
                        </Button>
                    </div>
                    <Button disabled={quickstartPage != 5} className={'w-48'} variant='contained' onClick={async () => {
                        window.localStorage.setItem("firstTimeSetupComplete", "true");
                        localStorage.setItem("lang", lang);

                        window.location.reload()
                    }}>{localization.close_menu[lang]}</Button>
                </div>
            </div>
            <div className='mb-2 flex justify-center space-x-4'>
                <Button sx={{
                    '&.Mui-disabled': {
                        color: config.light_mode ? '#666666 !important' : '#4f4f4f !important',
                        borderColor: config.light_mode ? '#666666 !important' : '#4f4f4f !important'
                    }
                }} variant='contained' disabled={quickstartPage == 0} onClick={() => { setQuickstartPage(quickstartPage - 1) }}>{localization.previous[lang]}</Button>
                {/* {(quickstartPage == 6 && (config.gemini_settings.desktop_capture || config.gemini_settings.microphone_capture) && config.gemini_settings.gemini_api_key.trim().length == 0) &&
                    <>
                        <Tooltip title={localization.you_have_empty_apikey[lang]}>
                            <Button sx={{
                                '&.Mui-disabled': {
                                    color: config.light_mode ? '#666666 !important' : '#4f4f4f !important',
                                    borderColor: config.light_mode ? '#666666 !important' : '#4f4f4f !important'
                                }
                            }} className='ml-4' variant='contained' color="warning" onClick={() => {
                                setConfig({
                                    ...config,
                                    gemini_settings: {
                                        ...config.gemini_settings,
                                        microphone_capture: false,
                                        desktop_capture: false
                                    }
                                })

                                setQuickstartPage(quickstartPage + 1)
                            }}>{localization.next[lang]}
                            </Button>
                        </Tooltip>
                    </>
                } */}

                {/* {quickstartPage == 2 &&
                    <>
                        <Tooltip title={localization.watch_tutorial[lang]}>
                            <Button sx={{
                                '&.Mui-disabled': {
                                    color: config.light_mode ? '#666666 !important' : '#4f4f4f !important',
                                    borderColor: config.light_mode ? '#666666 !important' : '#4f4f4f !important'
                                }
                            }} className='ml-4' variant='contained' color="warning" onClick={() => {
                                setQuickstartPage(quickstartPage + 1)
                            }}>{localization.next[lang]}
                            </Button>
                        </Tooltip>
                    </>
                } */}

                {!((quickstartPage == 6 && (config.gemini_settings.desktop_capture || config.gemini_settings.microphone_capture) && config.gemini_settings.gemini_api_key.trim().length == 0)) && <Button sx={{
                    '&.Mui-disabled': {
                        color: config.light_mode ? '#666666 !important' : '#4f4f4f !important',
                        borderColor: config.light_mode ? '#666666 !important' : '#4f4f4f !important'
                    }
                }} className='ml-4' variant='contained' disabled={quickstartPage > 4} onClick={() => { setQuickstartPage(quickstartPage + 1) }}>{localization.next[lang]}</Button>}
            </div>
        </div>

        {/* <div className={'transition-all z-20 w-full h-[192] flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (geminiTutorialShow ? " opacity-100" : " opacity-0 pointer-events-none")}>
            <div className={`flex flex-col items-center justify-center w-10/12 h-3/6 outline outline-1 ${config.light_mode ? "outline-white" : "outline-slate-950"} outline-gray-200 rounded ${config.light_mode ? "bg-white" : "bg-slate-950"}`}>
                {geminiTutorialShow &&
                    <video autoPlay loop controls className='mt-4'>
                        <source src="/gemini_tutorial.mp4" type="video/mp4"></source>
                    </video>
                }
                <div className='flex flex-row justify-center mt-4 mb-4'>
                    <Button variant="contained" className='w-48' onClick={() => { setGeminiTutorialShow(false) }}>{localization.close_menu[lang]}</Button>
                </div>
            </div>
        </div> */}
    </>
}