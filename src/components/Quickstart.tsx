import * as React from "react"
import { Config } from "../util/config"

import {
    GitHub,
    Settings,
    Translate
} from '@mui/icons-material';

import Scroll from "./Scroll"
import { localization } from "../util/localization";
import { Button, MenuItem, Select } from "@mui/material";
import { Lang } from "../util/constants";
import { invoke } from "@tauri-apps/api/core";

type QuickstartMenuProps = {
    config: Config,
    setQuickstartVisible: (value: React.SetStateAction<boolean>) => void,
    setLang: (value: React.SetStateAction<Lang>) => void,
    lang: Lang
}

export default function QuickstartMenu({ config, setQuickstartVisible, setLang, lang }: QuickstartMenuProps) {
    const [quickstartPage, setQuickstartPage] = React.useState(0)

    return <>
        <div className={`flex flex-col justify-between w-10/12 h-5/6 outline outline-2 rounded  ${!config.light_mode ? "bg-slate-950 outline-slate-950" : "bg-white outline-white"}`}>
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
                        <img className='mt-4 w-[384px]' src={
                            {
                                en: "/mode_select_screenshots/en.png",
                                jp: "/mode_select_screenshots/jp.png",
                                cn: "/mode_select_screenshots/cn.png",
                                kr: "/mode_select_screenshots/kr.png",
                                tr: "/mode_select_screenshots/tr.png"
                            }[lang]
                        } width={240} />
                        <p className='text-lg mt-4 text-center'>{localization.mode_selection_details[lang]}</p>
                    </div>
                </div>

                <div className={'absolute inset-0 transition-all space-y-2 flex flex-col items-center justify-center ease-in-out ' + (quickstartPage == 4 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                    <div className='mt-4 mb-4'>
                        <p className='text-xl mt-8 bold text-center'>{localization.thank_you[lang]}</p>
                        <p className='text-lg mt-20 text-center'>{localization.thank_you_details[lang]}</p>
                    </div>
                    <Button disabled={quickstartPage != 4} className={'w-70 '} variant='contained' startIcon={< GitHub />} onClick={async () => { open("https://github.com/YusufOzmen01/kikitan-translator") }}>{localization.open_repo[lang]}</Button>
                    <Button disabled={quickstartPage != 4} className={'w-48 '} variant='contained' onClick={async () => { setQuickstartVisible(false); window.localStorage.setItem("quickstartMenu", "true"); localStorage.setItem("lang", lang); setQuickstartPage(0) }}>{localization.close_menu[lang]}</Button>
                </div>
            </div>
            <div className='mb-2 flex justify-center space-x-4'>
                <Button variant='contained' disabled={quickstartPage == 0} onClick={() => { setQuickstartPage(quickstartPage - 1) }}>{localization.previous[lang]}</Button>
                <Button className='ml-4' variant='contained' disabled={quickstartPage > 3} onClick={() => { setQuickstartPage(quickstartPage + 1) }}>{localization.next[lang]}</Button>
            </div>
        </div>

    </>
}