import * as React from "react"

import {
    GitHub,
    Translate
} from '@mui/icons-material';

import Scroll from "./Scroll"
import { localization } from "../util/localization";
import { Box, Button, Checkbox, FormControlLabel, FormGroup, MenuItem, Select } from "@mui/material";
import {openURL, setConfig} from "../util/photino.ts";
import {app_state} from "../util/constants.ts";

export default function QuickstartMenu({ state }: { state: app_state }) {
    const [quickstartPage, setQuickstartPage] = React.useState(0)
    return <>
        <div className={`absolute z-10 flex flex-col justify-between w-10/12 h-5/6 outline outline-2 rounded  ${!state.config.light_mode ? "bg-slate-950 outline-slate-950" : "bg-white outline-white"}`}>
            <div className='relative mt-2 ml-2 mr-2 h-64'>
                <div className={`absolute inset-0 transition-all flex justify-center ease-in-out ${quickstartPage == 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                    <div className='absolute mt-28 flex flex-col items-center'>
                        <Scroll light_mode={state.config.light_mode}></Scroll>

                        <div className='mt-16 absolute flex flex-row items-center'>
                            <Translate className='mr-8 outline-2 ' />
                            <Select sx={{
                                color: state.config.light_mode ? 'black' : 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: state.config.light_mode ? 'black' : 'white',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: state.config.light_mode ? 'black' : 'white',
                                },
                            }} variant='outlined' className="mt-auto mr-8" value={state.config.language} onChange={(e) => {
                                setConfig("language", e.target.value)
                            }}>

                                <MenuItem value={"en"}>English</MenuItem>
                                <MenuItem value={"jp"}>日本語</MenuItem>
                                <MenuItem value={"cn"}>中文</MenuItem>
                                <MenuItem value={"kr"}>한국어</MenuItem>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className={'absolute inset-0 transition-all flex justify-center ease-in-out ' + (quickstartPage == 1 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                    <div className='absolute mt-2 flex flex-col items-center'>
                        <p className='text-xl bold text-center'>{localization.quickstart_osc[state.config.language]}</p>

                    </div>
                </div>

                <div className={'absolute inset-0 transition-all flex justify-center ease-in-out ' + (quickstartPage == 2 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                    <div className='absolute mt-2 flex flex-col items-center'>
                        <p className='text-xl bold text-center'>{localization.mode_selection[state.config.language]}</p>
                        <img className='mt-4 w-[256px]' src={
                            {
                                en: "/mode_select_screenshots/en.png",
                                jp: "/mode_select_screenshots/jp.png",
                                cn: "/mode_select_screenshots/cn.png",
                                kr: "/mode_select_screenshots/kr.png",
                            }[state.config.language]
                        } width={240} />
                        <p className='text-md mt-4 text-center'>{localization.mode_selection_details[state.config.language]}</p>
                    </div>
                </div>

                <Box sx={{
                    width: '100%',
                    '& .MuiSvgIcon-root': {
                        color: state.config.light_mode ? 'black' : '#94A3B8'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: state.config.light_mode ? 'black' : '#94A3B8',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: state.config.light_mode ? 'black' : '#94A3B8',
                    },
                    '& .MuiFormControlLabel-root.Mui-disabled .MuiFormControlLabel-label': {
                        color: state.config.light_mode ? '#666666' : '#4f4f4f'
                    }
                }} >
                    <div className={'absolute inset-0 transition-all space-y-2 flex flex-col items-center ease-in-out ' + (quickstartPage == 3 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                        <div className='mt-4 mb-4'>
                            <p className='text-4xl bold text-center'>{localization.change_basic_settings[state.config.language]}</p>
                        </div>
                        <FormGroup>
                            <FormControlLabel control={<Checkbox checked={state.config.disable_when_muted} onChange={(e) => setConfig("disable_when_muted", e.target.checked)} />} label={localization.disable_kikitan_when_muted[state.config.language]} />
                            <FormControlLabel control={<Checkbox checked={state.config.translation_only} onChange={(e) => setConfig("translation_only", e.target.checked)} />} label={localization.only_send_translation[state.config.language]} />
                        </FormGroup>
                    </div>
                </Box>

                <div className={'absolute inset-0 transition-all space-y-2 flex flex-col items-center justify-center ease-in-out ' + (quickstartPage == 4 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                    <div className='mt-4 mb-4'>
                        <p className='text-xl mt-8 bold text-center'>{localization.thank_you[state.config.language]}</p>
                        <p className='text-lg mt-20 text-center'>{localization.thank_you_details[state.config.language]}</p>
                    </div>
                    <Button disabled={quickstartPage != 4} className={'w-70'} variant='contained' startIcon={< GitHub />} onClick={async () => { openURL("https://github.com/YusufOzmen01/kikitan-translator") }}>{localization.open_repo[state.config.language]}</Button>
                    <div className="flex gap-2">
                        <Button sx={{
                            backgroundColor: "#ffde06",
                            color: "black"
                        }} disabled={quickstartPage != 4} variant="contained" className='w-52 h-9' onClick={() => { openURL("https://buymeacoffee.com/sergiomarquina") }}>
                            <img src="/buymeacoffeelogo.svg" width={36}></img>
                            <p className="mt-0.5">Buy Me a Coffee</p>
                        </Button>

                        <Button sx={{
                            backgroundColor: "#fc4d50"
                        }} disabled={quickstartPage != 4} variant="contained" className='w-52' onClick={() => { openURL("https://booth.pm/en/items/6073050") }}>
                            <img src="/boothlogo.svg" width={24} className="mr-2"></img>
                            <p className="mt-0.5">Booth.pm</p>
                        </Button>
                    </div>
                    <Button disabled={quickstartPage != 4} className={'w-48'} variant='contained' onClick={async () => {
                        setConfig("quickstart_viewed", true)
                    }}>{localization.close_menu[state.config.language]}</Button>
                </div>
            </div>
            <div className='mb-2 flex justify-center space-x-4'>
                <Button sx={{
                    '&.Mui-disabled': {
                        color: state.config.light_mode ? '#666666 !important' : '#4f4f4f !important',
                        borderColor: state.config.light_mode ? '#666666 !important' : '#4f4f4f !important'
                    }
                }} variant='contained' disabled={quickstartPage == 0} onClick={() => { setQuickstartPage(quickstartPage - 1) }}>{localization.previous[state.config.language]}</Button>
                {!(quickstartPage == 5) && <Button sx={{
                    '&.Mui-disabled': {
                        color: state.config.light_mode ? '#666666 !important' : '#4f4f4f !important',
                        borderColor: state.config.light_mode ? '#666666 !important' : '#4f4f4f !important'
                    }
                }} className='ml-4' variant='contained' disabled={quickstartPage > 3} onClick={() => { setQuickstartPage(quickstartPage + 1) }}>{localization.next[state.config.language]}</Button>}
            </div>
        </div>
    </>
}
