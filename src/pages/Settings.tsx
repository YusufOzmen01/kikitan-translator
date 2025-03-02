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
        }} className={`w-max h-screen ${config.light_mode ? "" : "bg-slate-950 text-slate-200"}`}>
            <Box className="flex" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <IconButton className="ml-2 mr-2" onClick={() => { closeCallback() }}>
                    <Close />
                </IconButton>
                <Tabs textColor="inherit" value={page} onChange={handleChange}>
                    <Tab label={localization.language_settings[lang]} {...a11yProps(0)} />
                    <Tab label={localization.vrchat_settings[lang]} {...a11yProps(1)} />
                    <Tab label={localization.debug_settings[lang]} {...a11yProps(2)} />
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
                        }
                    }} MenuProps={{
                        sx: {
                            "& .MuiPaper-root": {
                                backgroundColor: config.light_mode ? '#94A3B8' : '#020617',
                            }
                        }
                    }} className="w-48" value={config.vrchat_settings.chatbox_update_speed} onChange={(e) => {
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
            <CustomTabPanel className="flex" value={page} index={2}>
                <FormGroup>
                    <Button variant="contained" onClick={async () => {
                        open(await appLogDir())
                    }}>{localization.open_logs[lang]}</Button>
                </FormGroup>
            </CustomTabPanel>
        </Box>
    </>
}