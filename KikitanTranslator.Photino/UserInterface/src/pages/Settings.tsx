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
    Tooltip
} from "@mui/material";

import {
    Close,
    History,
} from '@mui/icons-material';

import {localization} from "../util/localization";
import {openURL, setConfig} from "../util/photino.ts";
import {app_state} from "../util/constants.ts";

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
    state: app_state;
}

export default function SettingsPage({ closeCallback, state }: SettingsProps) {
    const [page, setPage] = React.useState(0);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setPage(newValue);
    };

    return <>
        <Box sx={{
            width: '100%',
            '& .MuiSvgIcon-root': {
                color: state.config.light_mode ? 'black' : '#94A3B8'
            },
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: state.config.light_mode ? 'black' : 'white',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: state.config.light_mode ? 'black' : 'white',
            },
            '.MuiTabs-scrollButtons.Mui-disabled': {
                opacity: 0.3
            }

        }} className={`relative w-max h-screen ${state.config.light_mode ? "" : "bg-slate-950 text-slate-200"}`}>
            <div className="absolute z-10 ml-2">
                <Box className="flex" sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <IconButton className="mr-2" onClick={() => {
                        closeCallback();
                    }}>
                        <Close/>
                    </IconButton>
                    <Tabs textColor="inherit" value={page} onChange={handleChange} variant="scrollable"
                          scrollButtons="auto">
                        <Tab label={localization.vrchat_settings[state.config.language]} {...a11yProps(0)} />
                        <Tab label={localization.translator_settings[state.config.language]} {...a11yProps(1)} />
                        <Tab label={localization.advanced_settings[state.config.language]} {...a11yProps(2)} />
                    </Tabs>
                </Box>
                <CustomTabPanel className="flex" value={page} index={0}>
                    <FormGroup>
                        <Tooltip title={localization.do_not_send_original_tooltip[state.config.language]}>
                            <FormControlLabel control={<Checkbox checked={state.config.translation_only}
                                                                 onChange={(e) => setConfig("translation_only", e.target.checked)}/>}
                                              label={localization.only_send_translation[state.config.language]}/>
                        </Tooltip>
                        <Tooltip title={localization.disable_kikitan_when_muted_tooltip[state.config.language]}>
                            <FormControlLabel control={<Checkbox checked={state.config.disable_when_muted}
                                                                 onChange={(e) => setConfig("disable_when_muted", e.target.checked)}/>}
                                              label={localization.disable_kikitan_when_muted[state.config.language]}/>
                        </Tooltip>
                        <p className={`mt-2 ${state.config.light_mode ? "text-black" : "text-slate-400"}`}>{localization.chatbox_update_speed[state.config.language]}</p>
                        <Select sx={{
                            color: state.config.light_mode ? 'black' : 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: state.config.light_mode ? 'black' : '#94A3B8',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: state.config.light_mode ? 'black' : '#94A3B8',
                            },
                        }} MenuProps={{
                            sx: {
                                "& .MuiPaper-root": {
                                    backgroundColor: state.config.light_mode ? '#94A3B8' : '#020617',
                                }
                            }
                        }} className="mr-4 mt-2 w-32" value={state.config.chatbox_wait_per_char_ms}
                                onChange={(e) => setConfig("chatbox_wait_per_char_ms",e.target.value)}>
                            <MenuItem sx={{color: state.config.light_mode ? 'black' : 'white'}}
                                      value={60}>{localization.slow[state.config.language]}</MenuItem>
                            <MenuItem sx={{color: state.config.light_mode ? 'black' : 'white'}}
                                      value={30}>{localization.medium[state.config.language]}</MenuItem>
                            <MenuItem sx={{color: state.config.light_mode ? 'black' : 'white'}}
                                      value={15}>{localization.fast[state.config.language]}</MenuItem>
                        </Select>
                    </FormGroup>
                </CustomTabPanel>
                <CustomTabPanel className="flex" value={page} index={1}>
                    <FormGroup>
                        <div className="grid grid-rows-1 grid-cols-2 gap-24">
                            <div id="settings">
                                <p className={`mt-2 ${state.config.light_mode ? "text-black" : "text-slate-400"}`}>{localization.translation_service[state.config.language]}</p>
                                <Select sx={{
                                    color: state.config.light_mode ? 'black' : 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: state.config.light_mode ? 'black' : '#94A3B8',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: state.config.light_mode ? 'black' : '#94A3B8',
                                    },
                                }} MenuProps={{
                                    sx: {
                                        "& .MuiPaper-root": {
                                            backgroundColor: state.config.light_mode ? '#94A3B8' : '#020617',
                                        }
                                    }
                                }} className="w-96" value={state.config.translator} onChange={(e) => setConfig("translator", e.target.value)}>
                                    <MenuItem sx={{color: state.config.light_mode ? 'black' : 'white'}} value={0}>Google Translate ({localization.default[state.config.language]})</MenuItem>
                                    <MenuItem sx={{color: state.config.light_mode ? 'black' : 'white'}} value={1}>Groq ({localization.requires_free_api_key[state.config.language]})</MenuItem>
                                </Select>

                                <p className={`mt-2 ${state.config.light_mode ? "text-black" : "text-slate-400"}`}>{localization.recognition_service[state.config.language]}</p>
                                <Select sx={{
                                    color: state.config.light_mode ? 'black' : 'white',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: state.config.light_mode ? 'black' : '#94A3B8',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: state.config.light_mode ? 'black' : '#94A3B8',
                                    },
                                }} MenuProps={{
                                    sx: {
                                        "& .MuiPaper-root": {
                                            backgroundColor: state.config.light_mode ? '#94A3B8' : '#020617',
                                        }
                                    }
                                }} className="w-96" value={state.config.recognizer} onChange={(e) => setConfig("recognizer", e.target.value)}>
                                    <MenuItem sx={{color: state.config.light_mode ? 'black' : 'white'}} value={0}>Microsoft Bing ({localization.default[state.config.language]})</MenuItem>
                                    <MenuItem sx={{color: state.config.light_mode ? 'black' : 'white'}} value={1}>Groq ({localization.requires_free_api_key[state.config.language]})</MenuItem>

                                </Select>
                            </div>
                            <div id="api-keys">
                                <div id="grok-api-key">
                                    <p className={`mt-2 ${state.config.light_mode ? "text-black" : "text-slate-400"}`}>Groq {localization.api_key[state.config.language]}</p>
                                    <div className="flex gap-2">
                                        <TextField
                                            sx={{
                                                '& .MuiOutlinedInput-root.Mui-disabled': {
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderColor: state.config.light_mode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(148, 163, 184, 0.4)',
                                                    },
                                                },
                                                '& .MuiInputBase-input.Mui-disabled': {
                                                    WebkitTextFillColor: state.config.light_mode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(148, 163, 184, 0.5)',
                                                },
                                            }}
                                            slotProps={{
                                                inputLabel: {
                                                    style: {color: state.config.light_mode ? "black" : '#94A3B8'},
                                                },
                                                htmlInput: {
                                                    style: {color: state.config.light_mode ? "black" : '#fff'}
                                                }
                                            }}
                                            className="ml-2 mt-2 w-48"
                                            value={state.config.groq_api_key}
                                            id="outlined-basic"
                                            disabled={(state.config.translator != 1) && (state.config.recognizer != 1)}
                                            variant="outlined"
                                            type="password"
                                            color={state.config.groq_api_key.length == 0 ? "warning" : "primary"}
                                            onChange={(e) => setConfig("groq_api_key", e.target.value)}
                                        />
                                        <Button variant="contained"
                                                color={state.config.groq_api_key.length == 0 ? "warning" : "primary"}
                                                disabled={(state.config.translator != 1) && (state.config.recognizer != 1)} className="w-32 h-14"
                                                sx={{
                                                    "&.Mui-disabled": {
                                                        borderColor: state.config.light_mode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(148, 163, 184, 0.5)',
                                                        color: state.config.light_mode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(148, 163, 184, 0.5)',
                                                    }
                                                }}
                                                onClick={async () => {
                                                    openURL("https://console.groq.com/keys")
                                                    
                                                }}><p className="text-sm">{localization.get_api_key[state.config.language]}</p></Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FormGroup>
                </CustomTabPanel>
                <CustomTabPanel className="flex" value={page} index={2}>
                    <FormGroup>
                        <Button variant="contained"
                                onClick={() => openURL("LOGDIR")}>{localization.open_logs[state.config.language]}</Button>
                        <FormControlLabel control={<Checkbox checked={state.config.send_user_data}
                                                             onChange={(e) => setConfig("send_user_data", e.target.checked)}/>}
                                          label={localization.enable_user_data[state.config.language]}/>
                    </FormGroup>
                    <FormGroup>
                        <div className="flex transition-all gap-2">
                            {/*<TextField slotProps={{*/}
                            {/*    inputLabel: {*/}
                            {/*        style: { color: state.config.light_mode ? "black" : '#94A3B8' }*/}
                            {/*    },*/}
                            {/*    htmlInput: {*/}
                            {/*        style: { color: state.config.light_mode ? "black" : '#fff' }*/}
                            {/*    }*/}
                            {/*}} className="mt-2 w-48" value={config.vrchat_settings.osc_address} id="outlined-basic" label={localization.osc_address[state.config.language]} variant="outlined" onChange={(e) => {*/}
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
                                    style: {color: state.config.light_mode ? "black" : '#94A3B8'},
                                },
                                htmlInput: {
                                    style: {color: state.config.light_mode ? "black" : '#fff'}
                                }
                            }} className="ml-2 mt-2 w-48" value={state.config.osc_port} id="outlined-basic"
                                       label={localization.osc_port[state.config.language]} variant="outlined" type="number"
                                       onChange={(e) => setConfig("osc_port", parseInt(e.target.value))}/>
                            <IconButton
                                className={"duration-300 ml-2 " + ((state.config.osc_port != 9000) ? "opacity-0" : "opacity-100")}
                                disabled={state.config.osc_port != 9000} onClick={() => setConfig("osc_port", 9000)}>
                                <History/>
                            </IconButton>
                        </div>
                    </FormGroup>
                </CustomTabPanel>
            </div>
        </Box>
    </>
}