import * as React from "react"

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { appLogDir } from '@tauri-apps/api/path';

import { IconButton, FormControlLabel, FormGroup, Checkbox, TextField, Select, MenuItem, Button } from "@mui/material";

import {
    Close,
    History
} from '@mui/icons-material';
import { Config, DEFAULT_CONFIG, speed_presets } from "../util/config";

import { localization } from "../util/localization";
import { Lang } from "../util/constants";
import { open } from "@tauri-apps/plugin-shell";

type CustomTabPanelProps = {
    children: React.ReactNode;
    value: number;
    index: number;
} & React.HTMLAttributes<HTMLDivElement>;

function CustomTabPanel(props: CustomTabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

type SettingsProps = {
    closeCallback: () => void;
    config: Config;
    setConfig: (config: Config) => void;
    lang: Lang;
}

export default function Settings({ closeCallback, config, setConfig, lang }: SettingsProps) {
    const [page, setPage] = React.useState(0);
    const [geminiTutorialShow, setGeminiTutorialShow] = React.useState(false)

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setPage(newValue);
    };

    return <>
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
        }} className={`relative w-max h-screen ${config.light_mode ? "" : "bg-slate-950 text-slate-200"}`}>
            <div className="absolute z-10">
                <Box className="flex" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <IconButton className="ml-2 mr-2" onClick={() => { closeCallback() }}>
                        <Close />
                    </IconButton>
                    <Tabs textColor="inherit" value={page} onChange={handleChange}>
                        <Tab label={localization.language_settings[lang]} {...a11yProps(0)} />
                        <Tab label={localization.vrchat_settings[lang]} {...a11yProps(1)} />
                        <Tab label={localization.translator_settings[lang]} {...a11yProps(2)} />
                        <Tab label={localization.debug_settings[lang]} {...a11yProps(3)} />
                    </Tabs>
                </Box>
                <CustomTabPanel className="flex" value={page} index={0}>
                    <FormGroup>
                        <FormControlLabel control={<Checkbox checked={config.language_settings.japanese_omit_questionmark} onChange={(e) => {
                            setConfig({
                                ...config,
                                language_settings: {
                                    ...config.language_settings,
                                    japanese_omit_questionmark: e.target.checked
                                }
                            })
                        }} />} label={localization.omit_questionmark[lang]} />
                        <FormControlLabel control={<Checkbox checked={config.language_settings.english_gender_change} onChange={(e) => {
                            setConfig({
                                ...config,
                                language_settings: {
                                    ...config.language_settings,
                                    english_gender_change: e.target.checked
                                }
                            })
                        }} />} label={localization.english_gender_text[lang]} />
                        <FormControlLabel label={localization.gender[lang]} control={
                            <Select sx={{
                                color: config.light_mode ? 'black' : 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: config.light_mode ? 'black' : '#94A3B8',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: config.light_mode ? 'black' : '#94A3B8',
                                },
                            }} MenuProps={{
                                sx: {
                                    "& .MuiPaper-root": {
                                        backgroundColor: config.light_mode ? 'white' : '#020617',
                                    }
                                }
                            }} className="ml-2 mr-4 mt-2" value={config.language_settings.english_gender_change_gender} onChange={(e) => {
                                setConfig({
                                    ...config,
                                    language_settings: {
                                        ...config.language_settings,
                                        english_gender_change_gender: parseInt(e.target.value.toString())
                                    }
                                })
                            }}>
                                <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} key={"male"} value={0}>♂</MenuItem>
                                <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} key={"female"} value={1}>♀</MenuItem>

                            </Select>
                        } />
                    </FormGroup>
                </CustomTabPanel>
                <CustomTabPanel className="flex" value={page} index={1}>
                    <FormGroup>
                        <FormControlLabel control={<Checkbox checked={config.vrchat_settings.translation_first} onChange={(e) => {
                            setConfig({
                                ...config,
                                vrchat_settings: {
                                    ...config.vrchat_settings,
                                    translation_first: e.target.checked
                                }
                            })
                        }} />} label={localization.translation_first[lang]} />
                        <FormControlLabel control={<Checkbox checked={config.vrchat_settings.send_typing_while_talking} onChange={(e) => {
                            setConfig({
                                ...config,
                                vrchat_settings: {
                                    ...config.vrchat_settings,
                                    send_typing_while_talking: e.target.checked
                                }
                            })
                        }} />} label={localization.send_typing_while_talking[lang]} />
                        <FormControlLabel className="mb-2" control={<Checkbox checked={config.vrchat_settings.dont_send_when_muted} onChange={(e) => {
                            setConfig({
                                ...config,
                                vrchat_settings: {
                                    ...config.vrchat_settings,
                                    dont_send_when_muted: e.target.checked
                                }
                            })
                        }} />} label={localization.dont_send_when_muted[lang]} />
                        <div className="flex transition-all">
                            <TextField slotProps={{
                                inputLabel: {
                                    style: { color: config.light_mode ? "black" : '#94A3B8' }
                                },
                                htmlInput: {
                                    style: { color: config.light_mode ? "black" : '#fff' }
                                }
                            }} className="mt-2 w-48" value={config.vrchat_settings.osc_address} id="outlined-basic" label={localization.osc_address[lang]} variant="outlined" onChange={(e) => {
                                setConfig({
                                    ...config,
                                    vrchat_settings: {
                                        ...config.vrchat_settings,
                                        osc_address: e.target.value
                                    }
                                })
                            }} />
                            <TextField slotProps={{
                                inputLabel: {
                                    style: { color: config.light_mode ? "black" : '#94A3B8' },
                                },
                                htmlInput: {
                                    style: { color: config.light_mode ? "black" : '#fff' }
                                }
                            }} className="ml-2 mt-2 w-48" value={config.vrchat_settings.osc_port} id="outlined-basic" label={localization.osc_port[lang]} variant="outlined" type="number" onChange={(e) => {
                                setConfig({
                                    ...config,
                                    vrchat_settings: {
                                        ...config.vrchat_settings,
                                        osc_port: parseInt(e.target.value)
                                    }
                                })
                            }} />
                            <IconButton className={"duration-300 ml-2 " + ((config.vrchat_settings.osc_address == DEFAULT_CONFIG.vrchat_settings.osc_address && config.vrchat_settings.osc_port == DEFAULT_CONFIG.vrchat_settings.osc_port) ? "opacity-0" : "opacity-100")} disabled={
                                config.vrchat_settings.osc_address == DEFAULT_CONFIG.vrchat_settings.osc_address &&
                                config.vrchat_settings.osc_port == DEFAULT_CONFIG.vrchat_settings.osc_port}
                                onClick={() => {
                                    setConfig({
                                        ...config,
                                        vrchat_settings: {
                                            ...config.vrchat_settings,
                                            osc_address: DEFAULT_CONFIG.vrchat_settings.osc_address,
                                            osc_port: DEFAULT_CONFIG.vrchat_settings.osc_port
                                        }
                                    })
                                }}>
                                <History />
                            </IconButton>
                        </div>
                        <p className={`mt-2 ${config.light_mode ? "text-black" : "text-slate-400"}`}>{localization.chatbox_update_speed[lang]}</p>
                        <Select sx={{
                            color: config.light_mode ? 'black' : 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: config.light_mode ? 'black' : '#94A3B8',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: config.light_mode ? 'black' : '#94A3B8',
                        },
                        }} MenuProps={{
                            sx: {
                                "& .MuiPaper-root": {
                                    backgroundColor: config.light_mode ? '#94A3B8' : '#020617',
                                }
                            }
                        }} className="ml-2 mr-4 mt-2" value={config.language_settings.english_gender_change_gender} onChange={(e) => {
                            setConfig({
                                ...config,
                                language_settings: {
                                    ...config.language_settings,
                                    english_gender_change_gender: parseInt(e.target.value.toString())
                                }
                            })
                        }}>
                            <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} key={"male"} value={0}>♂</MenuItem>
                            <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} key={"female"} value={1}>♀</MenuItem>
                        </Select>} />
                </FormGroup>
            </CustomTabPanel>
            <CustomTabPanel className="flex" value={page} index={1}>
                <FormGroup>
                    <FormControlLabel control={<Checkbox checked={config.vrchat_settings.translation_first} onChange={(e) => {
                        setConfig({
                            ...config,
                            vrchat_settings: {
                                ...config.vrchat_settings,
                                translation_first: e.target.checked
                            }
                        })
                    }} />} label={localization.translation_first[lang]} />
                    <FormControlLabel control={<Checkbox checked={config.vrchat_settings.disable_kikitan_when_muted} onChange={(e) => {
                        setConfig({
                            ...config,
                            vrchat_settings: {
                                ...config.vrchat_settings,
                                disable_kikitan_when_muted: e.target.checked
                            }
                        })
                    }} />} label={localization.disable_kikitan_when_muted[lang]} />
                    <FormControlLabel className="mb-2" control={<Checkbox checked={config.vrchat_settings.send_typing_status_while_talking} onChange={(e) => {
                        setConfig({
                            ...config,
                            vrchat_settings: {
                                ...config.vrchat_settings,
                                send_typing_status_while_talking: e.target.checked
                            }
                        })
                    }} />} label={localization.send_typing_status_while_talking[lang]} />
                    <div className="flex transition-all">
                        <TextField slotProps={{
                            inputLabel: {
                                style: { color: config.light_mode ? "black" : '#94A3B8' }
                            },
                            htmlInput: {
                                style: { color: config.light_mode ? "black" : '#fff' }
                            }
                        }} className="mt-2 w-48" value={config.vrchat_settings.osc_address} id="outlined-basic" label={localization.osc_address[lang]} variant="outlined" onChange={(e) => {
                            setConfig({
                                ...config,
                                vrchat_settings: {
                                    ...config.vrchat_settings,
                                    chatbox_update_speed: parseInt(e.target.value.toString())
                                }
                            })
                        }} >
                            <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} value={speed_presets.slow}>{localization.slow[lang]}</MenuItem>
                            <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} value={speed_presets.medium}>{localization.medium[lang]}</MenuItem>
                            <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} value={speed_presets.fast}>{localization.fast[lang]}</MenuItem>
                        </Select>
                    </FormGroup>
                </CustomTabPanel>
                <CustomTabPanel value={page} index={2}>
                    <div className="flex flex-col">
                        <FormControlLabel label={localization.voice_recognition_engine[lang]} control={
                            <Select sx={{
                                color: config.light_mode ? 'black' : 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: config.light_mode ? 'black' : '#94A3B8',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: config.light_mode ? 'black' : '#94A3B8',
                                },
                            }} MenuProps={{
                                sx: {
                                    "& .MuiPaper-root": {
                                        backgroundColor: config.light_mode ? 'white' : '#020617',
                                    }
                                }
                            }} className="ml-2 mr-4 mt-2" value={config.translator_settings.recognizer} onChange={(e) => {
                                setConfig({
                                    ...config,
                                    translator_settings: {
                                        ...config.translator_settings,
                                        recognizer: parseInt(e.target.value.toString())
                                    }
                                })

                                setTimeout(() => window.location.reload(), 200)
                            }}>
                                <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} key={"webspeech"} value={0}>WebSpeech (Default)</MenuItem>
                                <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} key={"whisper"} value={1}>Whisper (WIP)</MenuItem>
                            </Select>
                        } />
                        <FormControlLabel label={localization.translator[lang]} control={
                            <Select sx={{
                                color: config.light_mode ? 'black' : 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: config.light_mode ? 'black' : '#94A3B8',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: config.light_mode ? 'black' : '#94A3B8',
                                },
                            }} MenuProps={{
                                sx: {
                                    "& .MuiPaper-root": {
                                        backgroundColor: config.light_mode ? 'white' : '#020617',
                                    }
                                }
                            }} className="ml-2 mr-4 mt-2" value={config.translator_settings.translator} onChange={(e) => {
                                setConfig({
                                    ...config,
                                    translator_settings: {
                                        ...config.translator_settings,
                                        translator: parseInt(e.target.value.toString())
                                    }
                                })
                            }}>
                                <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} key={"webspeech"} value={0}>Google Translate (Default)</MenuItem>
                                <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} key={"whisper"} value={1}>Gemini</MenuItem>
                            </Select>
                        } />
                        <div className="flex transition-all mt-2 gap-2">
                            <TextField slotProps={{
                                inputLabel: {
                                    style: { color: config.light_mode ? "black" : '#94A3B8' },
                                },
                                htmlInput: {
                                    style: { color: config.light_mode ? "black" : '#fff' }
                                }
                            }} className="ml-2 mt-2 w-48 h-8" value={config.translator_settings.gemini_api_key} id="outlined-basic" label={"Gemini API Key"} variant="outlined" type="password" disabled={config.translator_settings.translator != 1} onChange={(e) => {
                                setConfig({
                                    ...config,
                                    translator_settings: {
                                        ...config.translator_settings,
                                        gemini_api_key: e.target.value
                                    }
                                })
                            }} />
                            <Button variant="contained" color="success" className="h-14" onClick={async () => { open("https://aistudio.google.com/apikey"); }}>{localization.get_gemini_api_key[lang]}</Button>
                            <Button variant="contained" className="h-14" onClick={async () => { setGeminiTutorialShow(true) }}>{localization.gemini_api_key_tutorial[lang]}</Button>
                        </div>
                    </div>
                </CustomTabPanel>
                <CustomTabPanel className="flex" value={page} index={3}>
                    <FormGroup>
                        <Button variant="contained" onClick={async () => {
                            open(await appLogDir())
                        }}>{localization.open_logs[lang]}</Button>
                    </FormGroup>
                </CustomTabPanel>
            </div>
            <div className={'transition-all z-20 w-full h-[192] flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (geminiTutorialShow ? " opacity-100" : " opacity-0 pointer-events-none")}>
                <div className={`flex flex-col items-center justify-center w-10/12 h-3/6 outline outline-1 ${config.light_mode ? "outline-white" : "outline-slate-950"} outline-gray-200 rounded ${config.light_mode ? "bg-white" : "bg-slate-950"}`}>
                    {geminiTutorialShow &&
                        <video autoPlay loop className='mt-4'>
                            <source src="/gemini_tutorial.mp4" type="video/mp4"></source>
                        </video>
                    }
                    <div className='flex flex-row justify-center mt-4 mb-4'>
                        <Button variant="contained" className='w-48' onClick={() => { setGeminiTutorialShow(false) }}>{localization.close_menu[lang]}</Button>
                    </div>
                </div>
            </div>
        </Box>
    </>
}