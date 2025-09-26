import * as React from "react"

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { appLogDir } from '@tauri-apps/api/path';

import { IconButton, FormControlLabel, FormGroup, Checkbox, TextField, Select, MenuItem, Button, Slider } from "@mui/material";

import {
    Close,
    History,
    Delete
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

    const clearMessageHistory = () => {
        setConfig({
            ...config,
            message_history: {
                ...config.message_history,
                items: []
            }
        });
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
            '.MuiTabs-scrollButtons.Mui-disabled': {
                opacity: 0.3
            }

        }} className={`relative w-max h-screen ${config.light_mode ? "" : "bg-slate-950 text-slate-200"}`}>
            <div className="absolute z-10">
                <Box className="flex" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <IconButton className="ml-2 mr-2" onClick={() => { closeCallback(); }}>
                        <Close />
                    </IconButton>
                    <Tabs textColor="inherit" value={page} onChange={handleChange} variant="scrollable" scrollButtons="auto">
                        <Tab label={localization.vrchat_settings[lang]} {...a11yProps(0)} />
                        <Tab label="Gemini" {...a11yProps(1)} />
                        <Tab label={localization.message_history[lang]} {...a11yProps(2)} />
                        <Tab label={localization.data_out[lang]} {...a11yProps(3)} />
                        <Tab label={localization.debug_settings[lang]} {...a11yProps(4)} />
                    </Tabs>
                </Box>
                <CustomTabPanel className="flex" value={page} index={0}>
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
                        <FormControlLabel control={<Checkbox checked={config.vrchat_settings.only_translation} onChange={(e) => {
                            setConfig({
                                ...config,
                                vrchat_settings: {
                                    ...config.vrchat_settings,
                                    only_translation: e.target.checked
                                }
                            })
                        }} />} label={localization.only_send_translation[lang]} />
                        <FormControlLabel control={<Checkbox checked={config.vrchat_settings.send_typing_status_while_talking} onChange={(e) => {
                            setConfig({
                                ...config,
                                vrchat_settings: {
                                    ...config.vrchat_settings,
                                    send_typing_status_while_talking: e.target.checked
                                }
                            })
                        }} />} label={localization.send_typing_while_talking[lang]} />
                        <FormControlLabel className="mb-2" control={<Checkbox checked={config.vrchat_settings.disable_kikitan_when_muted} onChange={(e) => {
                            setConfig({
                                ...config,
                                vrchat_settings: {
                                    ...config.vrchat_settings,
                                    disable_kikitan_when_muted: e.target.checked
                                }
                            })
                        }} />} label={localization.disable_kikitan_when_muted[lang]} />
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
                        }} className="mr-4 mt-2 w-32" value={config.vrchat_settings.chatbox_update_speed} onChange={(e) => {
                            setConfig({
                                ...config,
                                vrchat_settings: {
                                    ...config.vrchat_settings,
                                    chatbox_update_speed: parseInt(e.target.value.toString())
                                }
                            })
                        }}>
                            <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} value={speed_presets.slow}>{localization.slow[lang]}</MenuItem>
                            <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} value={speed_presets.medium}>{localization.medium[lang]}</MenuItem>
                            <MenuItem sx={{ color: config.light_mode ? 'black' : 'white' }} value={speed_presets.fast}>{localization.fast[lang]}</MenuItem>
                        </Select>
                    </FormGroup>
                </CustomTabPanel>
                <CustomTabPanel value={page} index={1}>
                    <div className="flex flex-col">
                        <FormControlLabel control={<Checkbox checked={config.gemini_settings.gemini_enabled} onChange={(e) => {
                            setConfig({
                                ...config,
                                gemini_settings: {
                                    ...config.gemini_settings,
                                    gemini_enabled: e.target.checked
                                }
                            })
                        }} />} label={localization.enable_gemini[lang]} />
                        <FormControlLabel disabled={!config.gemini_settings.gemini_enabled} control={<Checkbox checked={config.gemini_settings.gemini_microphone_capture} onChange={(e) => {
                            setConfig({
                                ...config,
                                gemini_settings: {
                                    ...config.gemini_settings,
                                    gemini_microphone_capture: e.target.checked
                                }
                            })
                        }} />} label={localization.enable_gemini_microphone_capture[lang]} />
                        <FormControlLabel disabled={!config.gemini_settings.gemini_enabled} control={<Checkbox checked={config.gemini_settings.desktop_capture} onChange={(e) => {
                            setConfig({
                                ...config,
                                gemini_settings: {
                                    ...config.gemini_settings,
                                    desktop_capture: e.target.checked
                                }
                            })
                        }} />} label={localization.enable_desktop_capture[lang]} />
                        <div className="flex transition-all mt-3 gap-2">
                            <TextField slotProps={{
                                inputLabel: {
                                    style: { color: config.light_mode ? "black" : '#94A3B8' },
                                },
                                htmlInput: {
                                    style: { color: config.light_mode ? "black" : '#fff' }
                                }
                            }} className="w-48 h-8" value={config.gemini_settings.gemini_api_key} id="outlined-basic" label={"Gemini API Key"} variant="outlined" type="password" disabled={!config.gemini_settings.gemini_enabled} onChange={(e) => {
                                setConfig({
                                    ...config,
                                    gemini_settings: {
                                        ...config.gemini_settings,
                                        gemini_api_key: e.target.value
                                    }
                                })
                            }} />
                            <Button variant="contained" color="success" className="h-14" onClick={async () => { open("https://aistudio.google.com/apikey"); }}>{localization.get_gemini_api_key[lang]}</Button>
                            <Button variant="contained" className="h-14" onClick={async () => { setGeminiTutorialShow(true) }}>{localization.gemini_api_key_tutorial[lang]}</Button>
                        </div>
                    </div>
                </CustomTabPanel>
                <CustomTabPanel className="flex" value={page} index={2}>
                    <FormGroup>
                        <FormControlLabel control={<Checkbox checked={config.message_history.enabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setConfig({
                                ...config,
                                message_history: {
                                    ...config.message_history,
                                    enabled: e.target.checked
                                }
                            })
                        }} />} label={localization.enable_history[lang]} />
                        
                        <Typography className="mt-4" gutterBottom>
                            {localization.max_history_items[lang]} ({config.message_history.max_items})
                        </Typography>
                        <Slider
                            disabled={!config.message_history.enabled}
                            value={config.message_history.max_items}
                            min={10}
                            max={200}
                            step={10}
                            onChange={(_e: Event, newValue: number | number[]) => {
                                setConfig({
                                    ...config,
                                    message_history: {
                                        ...config.message_history,
                                        max_items: newValue as number
                                    }
                                });
                            }}
                            valueLabelDisplay="auto"
                            sx={{
                                width: 250,
                                color: config.light_mode ? 'rgba(0, 0, 0, 0.87)' : '#94A3B8',
                                '& .MuiSlider-thumb': {
                                    '&:hover, &.Mui-focusVisible': {
                                        boxShadow: '0px 0px 0px 8px rgba(25, 118, 210, 0.16)',
                                    },
                                },
                            }}
                        />

                        <div className="mt-4">
                            <Button 
                                variant="contained" 
                                color="error" 
                                startIcon={<Delete />}
                                onClick={clearMessageHistory}
                                disabled={!config.message_history.enabled || config.message_history.items.length === 0}
                                sx={{
                                    backgroundColor: config.light_mode ? undefined : 'rgba(211, 47, 47, 0.8)',
                                    color: '#ffffff',
                                    '&:hover': {
                                        backgroundColor: config.light_mode ? undefined : 'rgba(211, 47, 47, 1)',
                                    },
                                    '&.Mui-disabled': {
                                        backgroundColor: config.light_mode ? undefined : 'rgba(100, 100, 100, 0.2)',
                                        color: config.light_mode ? undefined : 'rgba(255, 255, 255, 0.3)',
                                    }
                                }}
                            >
                                {localization.clear_history[lang]}
                            </Button>
                            <Typography className="mt-2 text-sm" variant="body2" color={config.light_mode ? "textSecondary" : "rgba(255, 255, 255, 0.7)"}>
                                {config.message_history.items.length} {localization.message_history[lang].toLowerCase()}
                            </Typography>
                        </div>
                    </FormGroup>
                </CustomTabPanel>
                <CustomTabPanel className="flex" value={page} index={3}>
                    <FormGroup>
                        <FormControlLabel control={<Checkbox checked={config.data_out.enable_user_speak_data} onChange={(e) => {
                            setConfig({
                                ...config,
                                data_out: {
                                    ...config.data_out,
                                    enable_user_speak_data: e.target.checked
                                }
                            })
                        }} />} label={localization.enable_user_transcription_data[lang]} />
                        <FormControlLabel control={<Checkbox checked={config.data_out.enable_user_translation_data} onChange={(e) => {
                            setConfig({
                                ...config,
                                data_out: {
                                    ...config.data_out,
                                    enable_user_translation_data: e.target.checked
                                }
                            })
                        }} />} label={localization.enable_user_translation_data[lang]} />
                        <FormControlLabel control={<Checkbox checked={config.data_out.enable_desktop_data} onChange={(e) => {
                            setConfig({
                                ...config,
                                data_out: {
                                    ...config.data_out,
                                    enable_desktop_data: e.target.checked
                                }
                            })
                        }} />} label={localization.enable_desktop_data[lang]} />
                    </FormGroup>
                </CustomTabPanel>
                <CustomTabPanel className="flex" value={page} index={4}>
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