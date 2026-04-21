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
} from '@mui/material';

import {
  Settings,
  Translate,
  WbSunny,
  NightsStay,
  Favorite
} from '@mui/icons-material';

import Changelogs from './pages/Changelogs';
import { localization } from './util/localization';
import {controlKikitan, openURL, registerStateCallback, sendAppState, setConfig} from "./util/photino.ts";
import QuickstartMenu from "./components/Quickstart.tsx";
import SettingsPage from "./pages/Settings.tsx";
import {app_state} from "./util/constants.ts";

const appVersion = "2.0.0-rc.1"

function App() {
  const [changelogsVisible, setChangelogsVisible] = React.useState(false)
  const [settingsVisible, setSettingsVisible] = React.useState(false)
  const [donateVisible, setDonateVisible] = React.useState(false)
  
  const [stateUpdated, setStateUpdated] = React.useState<boolean>(false)
  // @ts-ignore
  const [appState, setAppState] = React.useState<app_state>({});

  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    setTimeout(() => setLoaded(true), 300);
    
    sendAppState()
    registerStateCallback(state => {
      console.log(state)
      
      setAppState(state)
      setStateUpdated(!stateUpdated)
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
      {appState.config != undefined && <div className={`relative transition-all duration-500 ${!loaded ? "opacity-0 pointer-events-none" : "opacity-100"} ${!appState.config.light_mode ? "bg-slate-950 text-white" : ""}`}>
        <div className={`transition-all z-20 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute` + (!appState.config.quickstart_viewed && appState.config.language != null ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <QuickstartMenu state={appState}></QuickstartMenu>
        </div>

        <div className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (donateVisible && appState.config.quickstart_viewed ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <div className={`flex flex-col justify-center w-6/12 h-3/6 outline outline-1 ${appState.config.light_mode ? "outline-white" : "outline-slate-950"} rounded ${appState.config.light_mode ? "bg-white" : "bg-slate-950"}`}>
            <div className='flex flex-row justify-center'>
              <p className='ml-4 text-md text-center'>{localization.donation_text[appState.config.language]}</p>
            </div>
            <div className='flex justify-center mt-4 gap-2 ml-4 mr-4'>
              <Button variant="contained" color="secondary" className='w-48' onClick={() => { openURL("https://buymeacoffee.com/sergiomarquina") }}><Favorite className='mr-2' /><p className='text-xs'>Buy Me a Coffee</p></Button>
              <Button sx={{
                backgroundColor: "#fc4d50"
              }} variant="contained" className='w-48' onClick={() => { openURL("https://booth.pm/en/items/6073050") }}>
                <img src="/boothlogo.svg" width={24} className="mr-2"></img>
                <p className="mt-0.5"><p className='text-xs'>Booth.pm</p></p>
              </Button>
              <Button variant="contained" className='w-48' onClick={() => { setDonateVisible(false) }}><p className='text-xs'>{localization.close_menu[appState.config.language]}</p></Button>
            </div>
          </div>
        </div>

        <div className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (settingsVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <div className={`flex flex-col justify-between  w-10/12 h-5/6 outline outline-1 ${appState.config.light_mode ? "outline-slate-400" : "outline-slate-950"} rounded bg-white`}>
            <SettingsPage state={appState} closeCallback={() => {
              setSettingsVisible(false)
              controlKikitan(true)
            }} />
          </div>
        </div>
        {appState.config.quickstart_viewed && changelogsVisible &&
            <div className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (changelogsVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
              <div className={`flex flex-col justify-between  w-10/12 h-5/6 outline outline-1 ${appState.config.light_mode ? "outline-slate-400" : "outline-slate-950"} rounded bg-white`}>
                <Changelogs state={appState} closeCallback={() => setChangelogsVisible(false)} />
              </div>
            </div>
        }

        <div className="flex flex-col h-screen z-0">
          <AppBar position="static">
            <Toolbar>
              <Typography className="flex" variant="h6" component="div" sx={{ flexGrow: 1 }}>
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
                }} variant='outlined' className="ml-4 mr-2" value={appState.config.speech_to_text_only ? 1 : 0} onChange={(e) => setConfig("speech_to_text_only", e.target.value == 1)}>
                  <MenuItem value={0}>{localization.translation[appState.config.language]}</MenuItem>
                  <MenuItem value={1}>{localization.stt_only[appState.config.language]}</MenuItem>
                </Select>
                <IconButton sx={{
                  color: 'white',
                  '& .MuiSvgIcon-root': {
                    color: 'white'
                  }
                }} onClick={() => setConfig("light_mode", !appState.config.light_mode)}>
                  {appState.config.light_mode ? <NightsStay /> : <WbSunny />}
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
                  <Translate />
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
                  <Settings />
                </IconButton>
              </div>
            </Toolbar>
          </AppBar>
          <div className='flex flex-1 items-center align-middle flex-col mt-8'>
            {loaded && appState.config.quickstart_viewed && <Kikitan state={appState} />}
          </div>
        </div>
      </div>}
    </>
  )
}

export default App
