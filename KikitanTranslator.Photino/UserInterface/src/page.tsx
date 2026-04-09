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
import {controlKikitan, getConfig, openURL, setConfig} from "./util/photino.ts";
import QuickstartMenu from "./components/Quickstart.tsx";
import SettingsPage from "./pages/Settings.tsx";

const appVersion = "2.0.0-rc.1"

function App() {
  const [quickstartVisible, setQuickstartVisible] = React.useState(true)
  const [changelogsVisible, setChangelogsVisible] = React.useState(false)
  const [settingsVisible, setSettingsVisible] = React.useState(false)
  const [donateVisible, setDonateVisible] = React.useState(false)
  const [lightMode, setLightMode] = React.useState<boolean>(false)
  
  const [mode, setMode] = React.useState<number>(0)
  const [lang, setLang] = React.useState<"en" | "jp" | "cn" | "kr" | "tr">("en")

  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    setTimeout(() => setLoaded(true), 300);

    // @ts-ignore
    setInterval(async () => {
      const config = await getConfig();

      setLang(config.language);
      setMode(config.speech_to_text_only ? 1 : 0)
      setLightMode(config.light_mode)
      setQuickstartVisible(!config.quickstart_viewed)
    }, 100);

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
      <div className={`relative transition-all duration-500 ${!loaded ? "opacity-0 pointer-events-none" : "opacity-100"} ${!lightMode ? "bg-slate-950 text-white" : ""}`}>
        <div className={`transition-all z-20 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute` + (quickstartVisible && lang != null ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <QuickstartMenu></QuickstartMenu>
        </div>

        <div className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (donateVisible && !quickstartVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <div className={`flex flex-col justify-center w-6/12 h-3/6 outline outline-1 ${lightMode ? "outline-white" : "outline-slate-950"} rounded ${lightMode ? "bg-white" : "bg-slate-950"}`}>
            <div className='flex flex-row justify-center'>
              <p className='ml-4 text-md text-center'>{localization.donation_text[lang]}</p>
            </div>
            <div className='flex justify-center mt-4 gap-2 ml-4 mr-4'>
              <Button variant="contained" color="secondary" className='w-48' onClick={() => { openURL("https://buymeacoffee.com/sergiomarquina") }}><Favorite className='mr-2' /><p className='text-xs'>Buy Me a Coffee</p></Button>
              <Button sx={{
                backgroundColor: "#fc4d50"
              }} variant="contained" className='w-48' onClick={() => { openURL("https://booth.pm/en/items/6073050") }}>
                <img src="/boothlogo.svg" width={24} className="mr-2"></img>
                <p className="mt-0.5"><p className='text-xs'>Booth.pm</p></p>
              </Button>
              <Button variant="contained" className='w-48' onClick={() => { setDonateVisible(false) }}><p className='text-xs'>{localization.close_menu[lang]}</p></Button>
            </div>
          </div>
        </div>

        <div className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (settingsVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <div className={`flex flex-col justify-between  w-10/12 h-5/6 outline outline-1 ${lightMode ? "outline-slate-400" : "outline-slate-950"} rounded bg-white`}>
            <SettingsPage closeCallback={() => {
              setSettingsVisible(false)
              controlKikitan(true)
            }} />
          </div>
        </div>
        {!quickstartVisible && changelogsVisible &&
          <div className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (changelogsVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
            <div className={`flex flex-col justify-between  w-10/12 h-5/6 outline outline-1 ${lightMode ? "outline-slate-400" : "outline-slate-950"} rounded bg-white`}>
              <Changelogs light_mode={lightMode} lang={lang} closeCallback={() => setChangelogsVisible(false)} />
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
                }} variant='outlined' className="ml-4 mr-2" value={mode} onChange={(e) => setConfig("speech_to_text_only", e.target.value == 1)}>
                  <MenuItem value={0}>{localization.translation[lang]}</MenuItem>
                  <MenuItem value={1}>{localization.stt_only[lang]}</MenuItem>
                </Select>
                <IconButton sx={{
                  color: 'white',
                  '& .MuiSvgIcon-root': {
                    color: 'white'
                  }
                }} onClick={() => setConfig("light_mode", !lightMode)}>
                  {lightMode ? <NightsStay /> : <WbSunny />}
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
            {loaded && !quickstartVisible && <Kikitan />}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
