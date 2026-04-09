import * as React from "react"

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import {
    IconButton,
    FormControlLabel,
    FormGroup,
    Checkbox,
    TextField,
    Select,
    MenuItem,
    Button,
} from "@mui/material";

import {
    Close,
    History,
} from '@mui/icons-material';

import {localization} from "../util/localization";
import {getConfig, openURL, setConfig} from "../util/photino.ts";

type CustomTabPanelProps = {
    children: React.ReactNode;
    value: number;
    index: number;
} & React.HTMLAttributes<HTMLDivElement>;

function CustomTabPanel(props: CustomTabPanelProps) {
    const {children, value, index, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{p: 3}}>
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
}

export default function SettingsPage({closeCallback}: SettingsProps) {
    const [page, setPage] = React.useState(0);
    const [lang, setLang] = React.useState<"en" | "jp" | "cn" | "kr" | "tr">("en")
    const [lightMode, setLightMode] = React.useState<boolean>(false)

    const [disableKikitanWhenMuted, setDisableKikitanWhenMuted] = React.useState<boolean>(false)
    const [translationOnly, setTranslationOnly] = React.useState<boolean>(false)
    const [chatboxWaitPerCharMs, setChatboxWaitPerCharMs] = React.useState<number>(0)
    const [oscPort, setOscPort] = React.useState<number>(0)
    const [sendUserData, setSendUserData] = React.useState<boolean>(false)
    const [recognizer, setRecognizer] = React.useState<number>(0)
    const [translator, setTranslator] = React.useState<number>(0)
    const [desktopTranslation, setDesktopTranslation] = React.useState<boolean>(false)
    const [groqApiKey, setGroqApiKey] = React.useState<string>("")

    setInterval(async () => {
        const config = await getConfig();

        setLang(config.language);
        setLightMode(lightMode)
        setDisableKikitanWhenMuted(config.disable_when_muted)
        setTranslationOnly(config.translation_only)
        setChatboxWaitPerCharMs(config.chatbox_wait_per_char_ms)
        setOscPort(config.osc_port)
        setSendUserData(config.send_user_data)
        setRecognizer(config.recognizer)
        setTranslator(config.translator)
        setDesktopTranslation(config.desktop_translation)
        setGroqApiKey(config.groq_api_key)

    }, 100);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setPage(newValue);
    };

    return <>
        <Box sx={{
            width: '100%',
            '& .MuiSvgIcon-root': {
                color: lightMode ? 'black' : '#94A3B8'
            },
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: lightMode ? 'black' : 'white',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: lightMode ? 'black' : 'white',
            },
            '.MuiTabs-scrollButtons.Mui-disabled': {
                opacity: 0.3
            }

        }} className={`relative w-max h-screen ${lightMode ? "" : "bg-slate-950 text-slate-200"}`}>
            <div className="absolute z-10">
                <Box className="flex" sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <IconButton className="ml-2 mr-2" onClick={() => {
                        closeCallback();
                    }}>
                        <Close/>
                    </IconButton>
                    <Tabs textColor="inherit" value={page} onChange={handleChange} variant="scrollable"
                          scrollButtons="auto">
                        <Tab label={localization.vrchat_settings[lang]} {...a11yProps(0)} />
                        <Tab label={localization.translator_settings[lang]} {...a11yProps(1)} />
                        <Tab label={localization.advanced_settings[lang]} {...a11yProps(2)} />
                    </Tabs>
                </Box>
                <CustomTabPanel className="flex" value={page} index={0}>
                    <FormGroup>
                        <FormControlLabel control={<Checkbox checked={translationOnly}
                                                             onChange={(e) => setConfig("translation_only", e.target.checked)}/>}
                                          label={localization.only_send_translation[lang]}/>
                        <FormControlLabel control={<Checkbox checked={disableKikitanWhenMuted}
                                                             onChange={(e) => setConfig("disable_when_muted", e.target.checked)}/>}
                                          label={localization.disable_kikitan_when_muted[lang]}/>
                        <p className={`mt-2 ${lightMode ? "text-black" : "text-slate-400"}`}>{localization.chatbox_update_speed[lang]}</p>
                        <Select sx={{
                            color: lightMode ? 'black' : 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: lightMode ? 'black' : '#94A3B8',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: lightMode ? 'black' : '#94A3B8',
                            },
                        }} MenuProps={{
                            sx: {
                                "& .MuiPaper-root": {
                                    backgroundColor: lightMode ? '#94A3B8' : '#020617',
                                }
                            }
                        }} className="mr-4 mt-2 w-32" value={chatboxWaitPerCharMs}
                                onChange={(e) => setConfig("chatbox_wait_per_char_ms", e.target.value)}>
                            <MenuItem sx={{color: lightMode ? 'black' : 'white'}}
                                      value={60}>{localization.slow[lang]}</MenuItem>
                            <MenuItem sx={{color: lightMode ? 'black' : 'white'}}
                                      value={30}>{localization.medium[lang]}</MenuItem>
                            <MenuItem sx={{color: lightMode ? 'black' : 'white'}}
                                      value={15}>{localization.fast[lang]}</MenuItem>
                        </Select>
                    </FormGroup>
                </CustomTabPanel>
                <CustomTabPanel className="flex" value={page} index={1}>
                    <FormGroup>
                        <div className="grid grid-rows-1 grid-cols-2 gap-24">
                            <div id="settings">
                                <p className={`mt-2 ${lightMode ? "text-black" : "text-slate-400"}`}>{localization.translation_service[lang]}</p>
                                <Select sx={{
                                    color: lightMode ? 'black' : 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: lightMode ? 'black' : '#94A3B8',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: lightMode ? 'black' : '#94A3B8',
                                    },
                                }} MenuProps={{
                                    sx: {
                                        "& .MuiPaper-root": {
                                            backgroundColor: lightMode ? '#94A3B8' : '#020617',
                                        }
                                    }
                                }} className="w-96" value={translator} onChange={(e) => setConfig("translator", e.target.value)}>
                                    <MenuItem sx={{color: lightMode ? 'black' : 'white'}} value={0}>Google Translate ({localization.default[lang]})</MenuItem>
                                    <MenuItem sx={{color: lightMode ? 'black' : 'white'}} value={1}>Groq ({localization.requires_free_api_key[lang]}, {localization.recommended[lang]})</MenuItem>
                                </Select>

                                <p className={`mt-2 ${lightMode ? "text-black" : "text-slate-400"}`}>{localization.recognition_service[lang]}</p>
                                <Select sx={{
                                    color: lightMode ? 'black' : 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: lightMode ? 'black' : '#94A3B8',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: lightMode ? 'black' : '#94A3B8',
                                    },
                                }} MenuProps={{
                                    sx: {
                                        "& .MuiPaper-root": {
                                            backgroundColor: lightMode ? '#94A3B8' : '#020617',
                                        }
                                    }
                                }} className="w-96" value={recognizer} onChange={(e) => setConfig("recognizer", e.target.value)}>
                                    <MenuItem sx={{color: lightMode ? 'black' : 'white'}} value={0}>Microsoft Bing ({localization.default[lang]})</MenuItem>
                                    <MenuItem sx={{color: lightMode ? 'black' : 'white'}} value={1}>Groq ({localization.requires_free_api_key[lang]})</MenuItem>

                                </Select>
                            </div>
                            <div id="api-keys">
                                <div id="grok-api-key">
                                    <p className={`mt-2 ${lightMode ? "text-black" : "text-slate-400"}`}>Groq {localization.api_key[lang]}</p>
                                    <div className="flex gap-2">
                                        <TextField
                                            sx={{
                                                '& .MuiOutlinedInput-root.Mui-disabled': {
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: lightMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(148, 163, 184, 0.4)',
                                                    },
                                                },
                                                '& .MuiInputBase-input.Mui-disabled': {
                                                    WebkitTextFillColor: lightMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(148, 163, 184, 0.5)',
                                                },
                                            }}
                                            slotProps={{
                                                inputLabel: {
                                                    style: {color: lightMode ? "black" : '#94A3B8'},
                                                },
                                                htmlInput: {
                                                    style: {color: lightMode ? "black" : '#fff'}
                                                }
                                            }}
                                            className="ml-2 mt-2 w-48"
                                            value={groqApiKey}
                                            id="outlined-basic"
                                            disabled={(translator != 1) && (recognizer != 1)}
                                            variant="outlined"
                                            type="password"
                                            color={groqApiKey.length == 0 ? "warning" : "primary"}
                                            onChange={(e) => setConfig("groq_api_key", e.target.value)}
                                        />
                                        <Button variant="contained"
                                                color={groqApiKey.length == 0 ? "warning" : "primary"}
                                                disabled={(translator != 1) && (recognizer != 1)} className="w-32 h-14"
                                                onClick={async () => {
                                                    openURL("https://console.groq.com/keys")
                                                }}><p className="text-sm">{localization.get_api_key[lang]}</p></Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <FormControlLabel className="mt-2" control={<Checkbox checked={desktopTranslation} onChange={(e) => setConfig("desktop_translation", e.target.checked)}/>}
                                          label={localization.enable_desktop_capture[lang]}/>
                    </FormGroup>
                </CustomTabPanel>
                <CustomTabPanel className="flex" value={page} index={2}>
                    <FormGroup>
                        <Button variant="contained"
                                onClick={() => openURL("LOGDIR")}>{localization.open_logs[lang]}</Button>
                        <FormControlLabel control={<Checkbox checked={sendUserData}
                                                             onChange={(e) => setConfig("send_user_data", e.target.value)}/>}
                                          label={localization.enable_user_data[lang]}/>
                    </FormGroup>
                    <FormGroup>
                        <div className="flex transition-all gap-2">
                            {/*<TextField slotProps={{*/}
                            {/*    inputLabel: {*/}
                            {/*        style: { color: lightMode ? "black" : '#94A3B8' }*/}
                            {/*    },*/}
                            {/*    htmlInput: {*/}
                            {/*        style: { color: lightMode ? "black" : '#fff' }*/}
                            {/*    }*/}
                            {/*}} className="mt-2 w-48" value={config.vrchat_settings.osc_address} id="outlined-basic" label={localization.osc_address[lang]} variant="outlined" onChange={(e) => {*/}
                            {/*    setConfig({*/}
                            {/*        ...config,*/}
                            {/*        vrchat_settings: {*/}
                            {/*            ...config.vrchat_settings,*/}
                            {/*            osc_address: e.target.value*/}
                            {/*        }*/}
                            {/*    })*/}
                            {/*}} />*/}
                            <TextField slotProps={{
                                inputLabel: {
                                    style: {color: lightMode ? "black" : '#94A3B8'},
                                },
                                htmlInput: {
                                    style: {color: lightMode ? "black" : '#fff'}
                                }
                            }} className="ml-2 mt-2 w-48" value={oscPort} id="outlined-basic"
                                       label={localization.osc_port[lang]} variant="outlined" type="number"
                                       onChange={(e) => setConfig("osc_port", parseInt(e.target.value))}/>
                            <IconButton
                                className={"duration-300 ml-2 " + ((oscPort != 9000) ? "opacity-0" : "opacity-100")}
                                disabled={oscPort != 9000} onClick={() => setConfig("osc_port", 9000)}>
                                <History/>
                            </IconButton>
                        </div>
                    </FormGroup>
                </CustomTabPanel>
            </div>
        </Box>
    </>
}