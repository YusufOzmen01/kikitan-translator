import * as React from 'react';

import Kikitan from "./pages/Kikitan"

import {
    AppBar,
    Toolbar,
    Typography,
    Select,
    MenuItem,
    Button,
    IconButton,
    CircularProgress
} from '@mui/material';

import {
    Settings,
    Translate,
    WbSunny,
    NightsStay,
    Favorite,
    DownloadOutlined,
    Clear,
} from '@mui/icons-material';

import Changelogs from './pages/Changelogs';
import {localization} from './util/localization';
import {
    controlKikitan,
    fetchURL,
    openURL,
    registerStateCallback,
    sendAppState,
    setConfig,
    update
} from "./util/photino.ts";
import QuickstartMenu from "./components/Quickstart.tsx";
import SettingsPage from "./pages/Settings.tsx";
import {app_state} from "./util/constants.ts";

let updateViewed = false;

function App() {
    const [changelogsVisible, setChangelogsVisible] = React.useState(false)
    const [settingsVisible, setSettingsVisible] = React.useState(false)
    const [donateVisible, setDonateVisible] = React.useState(false)
    const [updaterVisible, setUpdaterVisible] = React.useState(false)
    const [updating, setUpdating] = React.useState(false)
    const [showProgress, setShowProgress] = React.useState(false)
    const [updaterText, setUpdaterText] = React.useState("")
    const [newVersion, setNewVersion] = React.useState("")
    const [appVersion, setAppVersion] = React.useState("")

    const [stateUpdated, setStateUpdated] = React.useState<boolean>(false)
    // @ts-ignore
    const [appState, setAppState] = React.useState<app_state>({});

    const [loaded, setLoaded] = React.useState(false)
    const [changelog, setChangelog] = React.useState("")

    React.useEffect(() => {
        setTimeout(() => setLoaded(true), 300);

        sendAppState()
        registerStateCallback(state => {
            if (!updateViewed) {
                setUpdaterText(localization.new_update_available[state.config.language])
                setUpdaterVisible(state.app_version != state.server_version)
                
                setAppVersion(state.app_version)
                setNewVersion(state.server_version)

                updateViewed = state.config.update_waiting
            }
            
            setChangelogsVisible(state.config.last_version != state.app_version)

            setAppState(state)
            setStateUpdated(!stateUpdated)

            if (changelog.length == 0) {
                setChangelog("LOADING")
                fetchURL(`https://github.com/YusufOzmen01/velopack-test/releases/latest/download/CHANGELOG_${state.config.language}.md`)
                    .then(resp => setChangelog(resp))
            }
        })

        if (localStorage.getItem("last_donation") == null) {
            localStorage.setItem("last_donation", "1")
        } else {
            const last = parseInt(localStorage.getItem("last_donation")!)

            if ((last + 60 * 60 * 12 * 1000) <= Date.now()) {
                setDonateVisible(true)
                localStorage.setItem("last_donation", `${Date.now()}`)
            }
        }
    }, [])

    return (
        <>
            {appState.config != undefined && <div
                className={`relative transition-all duration-500 ${!loaded ? "opacity-0 pointer-events-none" : "opacity-100"} ${!appState.config.light_mode ? "bg-slate-950 text-white" : ""}`}>
                <div
                    className={`transition-all z-20 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute` + (!appState.config.quickstart_viewed && appState.config.language != null ? " opacity-100" : " opacity-0 pointer-events-none")}>
                    <QuickstartMenu state={appState}></QuickstartMenu>
                </div>

                <div
                    className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (donateVisible && appState.config.quickstart_viewed ? " opacity-100" : " opacity-0 pointer-events-none")}>
                    <div
                        className={`flex flex-col justify-center w-6/12 h-3/6 outline outline-1 ${appState.config.light_mode ? "outline-white" : "outline-slate-950"} rounded ${appState.config.light_mode ? "bg-white" : "bg-slate-950"}`}>
                        <div className='flex flex-row justify-center'>
                            <p className='ml-4 text-md text-center'>{localization.donation_text[appState.config.language]}</p>
                        </div>
                        <div className='flex justify-center mt-4 gap-2 ml-4 mr-4'>
                            <Button variant="contained" color="secondary" className='w-48' onClick={() => {
                                openURL("https://buymeacoffee.com/sergiomarquina")
                            }}><Favorite className='mr-2'/><p className='text-xs'>Buy Me a Coffee</p></Button>
                            <Button sx={{
                                backgroundColor: "#fc4d50"
                            }} variant="contained" className='w-48' onClick={() => {
                                openURL("https://booth.pm/en/items/6073050")
                            }}>
                                <img src="/boothlogo.svg" width={24} className="mr-2"></img>
                                <p className="mt-0.5"><p className='text-xs'>Booth.pm</p></p>
                            </Button>
                            <Button variant="contained" className='w-48' onClick={() => {
                                setDonateVisible(false)
                            }}><p className='text-xs'>{localization.close_menu[appState.config.language]}</p></Button>
                        </div>
                    </div>
                </div>

                <div
                    className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (updaterVisible && appState.config.quickstart_viewed ? " opacity-100" : " opacity-0 pointer-events-none")}>
                    <div
                        className={`flex flex-row items-center w-96 h-48 outline outline-1 ${appState.config.light_mode ? "outline-white" : "outline-slate-950"} rounded ${appState.config.light_mode ? "bg-white" : "bg-slate-950"} px-4 gap-4`}>
                        
                        <div className={`flex flex-col flex-1 transition-opacity duration-240 ${(updating && !showProgress) ? "opacity-0" : "opacity-100"}`}>
                            <p className={`${showProgress ? "text-4xl" : "text-3xl"} text-center`}>{updaterText}</p>
                            {!showProgress && <p className="text-md italic text-slate-600 text-center">{newVersion}</p>}
                        </div>
                        
                        <div className="relative flex flex-col gap-2" style={{ width: 128, height: 104 }}>
                            <div className={`transition-opacity duration-300 ${updating ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                                <Button
                                    variant="contained"
                                    disabled={updating}
                                    color="success"
                                    className='w-32 h-12'
                                    onClick={() => {
                                        setUpdating(true)
                                        setTimeout(() => {
                                            setShowProgress(true)
                                            setUpdaterText(localization.updating[appState.config.language])
                                            update()
                                        }, 300)
                                    }}>
                                    <p className='text-md'>
                                        <DownloadOutlined fontSize="small" />
                                        {localization.update[appState.config.language]}
                                    </p>
                                </Button>
                            </div>
                            <div className={`transition-opacity duration-300 ${updating ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                                <Button
                                    variant="contained"
                                    disabled={updating}
                                    className='w-32 h-12'
                                    onClick={() => setUpdaterVisible(false)}>
                                    <Clear fontSize="small" />
                                    <p className='text-xs'>{localization.close_menu[appState.config.language]}</p>
                                </Button>
                            </div>
                            
                            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 z-20 ${showProgress ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                                <CircularProgress size={96} />
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (settingsVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
                    <div
                        className={`flex flex-col justify-between  w-10/12 h-5/6 outline outline-1 ${appState.config.light_mode ? "outline-slate-400" : "outline-slate-950"} rounded bg-white`}>
                        <SettingsPage state={appState} closeCallback={() => {
                            setSettingsVisible(false)
                            controlKikitan(true)
                        }}/>
                    </div>
                </div>
                {appState.config.quickstart_viewed && changelogsVisible &&
                    <div
                        className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (changelogsVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
                        <div
                            className={`flex flex-col justify-between  w-10/12 h-5/6 outline outline-1 ${appState.config.light_mode ? "outline-slate-400" : "outline-slate-950"} rounded bg-white`}>
                            <Changelogs changelog={changelog} state={appState} closeCallback={() => {
                                setConfig("last_version", appState.app_version)
                                setChangelogsVisible(false)
                            }}/>
                        </div>
                    </div>
                }

                <div className="flex flex-col h-screen z-0">
                    <AppBar position="static">
                        <Toolbar>
                            <Typography className="flex" variant="h6" component="div" sx={{flexGrow: 1}}>
                                Kikitan Translator
                                <p className="text-sm italic ml-2 mt-2">
                                    <a href='' onClick={(e) => {
                                        e.preventDefault()

                                        setChangelogsVisible(true)
                                    }}>v{appVersion}</a>
                                </p>
                            </Typography>
                            <div className='flex'>
                                <Select sx={{
                                    color: 'white',
                                    '& .MuiSvgIcon-root': {
                                        color: 'white'
                                    }
                                }} variant='outlined' className="ml-4 mr-2"
                                        value={appState.config.speech_to_text_only ? 1 : 0}
                                        onChange={(e) => setConfig("speech_to_text_only", e.target.value == 1)}>
                                    <MenuItem value={0}>{localization.translation[appState.config.language]}</MenuItem>
                                    <MenuItem value={1}>{localization.stt_only[appState.config.language]}</MenuItem>
                                </Select>
                                <IconButton sx={{
                                    color: 'white',
                                    '& .MuiSvgIcon-root': {
                                        color: 'white'
                                    }
                                }} onClick={() => setConfig("light_mode", !appState.config.light_mode)}>
                                    {appState.config.light_mode ? <NightsStay/> : <WbSunny/>}
                                </IconButton>
                                <IconButton sx={{
                                    color: 'white',
                                    '& .MuiSvgIcon-root': {
                                        color: 'white'
                                    }
                                }} onClick={() => {
                                    controlKikitan(false)
                                    setConfig("quickstart_viewed", false)
                                }}>
                                    <Translate/>
                                </IconButton>
                                <IconButton sx={{
                                    color: 'white',
                                    '& .MuiSvgIcon-root': {
                                        color: 'white'
                                    }
                                }} onClick={() => {
                                    controlKikitan(false)
                                    setSettingsVisible(true)
                                }}>
                                    <Settings/>
                                </IconButton>
                            </div>
                        </Toolbar>
                    </AppBar>
                    <div className='flex flex-1 items-center align-middle flex-col mt-8'>
                        {loaded && appState.config.quickstart_viewed && <Kikitan state={appState}/>}
                    </div>
                </div>
            </div>}
        </>
    )
}

export default App
