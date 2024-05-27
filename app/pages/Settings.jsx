import * as React from "react"

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { IconButton, FormControlLabel, FormGroup, Checkbox, TextField, Select, MenuItem } from "@mui/material";

import {
    Close,
    History
} from '@mui/icons-material';
import { DEFAULT_CONFIG, speed_presets } from "../util/config";

function CustomTabPanel(props) {
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

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

export default function Settings({ closeCallback, config, setConfig }) {
    const [page, setPage] = React.useState(0);

    const handleChange = (event, newValue) => {
        setPage(newValue);
    };

    return <>
        <Box sx={{ width: '100%' }}>
            <Box className="flex" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={page} onChange={handleChange}>
                    <Tab label="Language Settings (言語設定)" {...a11yProps(0)} />
                    <Tab label="VRChat Settings (VRChat設定)" {...a11yProps(1)} />
                </Tabs>
                <IconButton className="ml-auto mr-2" onClick={() => { closeCallback() }}>
                    <Close />
                </IconButton>
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
                    }} />} label="(Japanese/日本語) Omit the trailing question mark (文末の疑問符を省略)" />
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
                    }} />} label="Translation first (最初に翻訳文を表示)" />
                    <FormControlLabel control={<Checkbox checked={config.vrchat_settings.send_typing_while_talking} onChange={(e) => {
                        setConfig({
                            ...config,
                            vrchat_settings: {
                                ...config.vrchat_settings,
                                send_typing_while_talking: e.target.checked
                            }
                        })
                    }} />} label="Send typing status while talking (会話中に入力ステータスを送信する)" />
                    <div className="flex">
                        <TextField className="mt-2 w-48" value={config.vrchat_settings.osc_address} id="outlined-basic" label="OSC Address (OSCアドレス)" variant="outlined" onChange={(e) => {
                            setConfig({
                                ...config,
                                vrchat_settings: {
                                    ...config.vrchat_settings,
                                    osc_address: e.target.value
                                }
                            })
                        }} />
                        <TextField className="ml-2 mt-2 w-48" value={config.vrchat_settings.osc_port} id="outlined-basic" label="OSC Port (OSCポート)" variant="outlined" type="number" onChange={(e) => {
                            setConfig({
                                ...config,
                                vrchat_settings: {
                                    ...config.vrchat_settings,
                                    osc_port: e.target.value
                                }
                            })
                        }} />
                        <IconButton className="ml-2" disabled={
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
                    <p className="mt-2">Chatbox Update Speed (チャットボックス更新速度)</p>
                    <Select className="mt-0 w-48" value={config.vrchat_settings.chatbox_update_speed} onChange={(e) => {
                        setConfig({
                            ...config,
                            vrchat_settings: {
                                ...config.vrchat_settings,
                                chatbox_update_speed: e.target.value
                            }
                        })
                    }} >
                        <MenuItem value={speed_presets.slow}>Slow (スロー)</MenuItem>
                        <MenuItem value={speed_presets.medium}>Medium (中)</MenuItem>
                        <MenuItem value={speed_presets.fast}>Fast (高速)</MenuItem>
                    </Select>
                </FormGroup>
            </CustomTabPanel>
        </Box>
    </>
}