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

const LIGHT_MODE = false;
const lang = "en"
const appVersion = "1.3.0-rc.2"
const MODE = 0;

function App() {
  const [quickstartVisible, setQuickstartVisible] = React.useState(false)
  const [changelogsVisible, setChangelogsVisible] = React.useState(false)
  const [settingsVisible, setSettingsVisible] = React.useState(false)
  const [donateVisible, setDonateVisible] = React.useState(false)
  const [googleServersErrorVisible, setGoogleServersErrorVisible] = React.useState(false)

  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    // @ts-ignore
    if (window.external.receiveMessage == undefined) window.location.reload();
    
    setTimeout(() => setLoaded(true), 300);
  }, [])

  return (
    <>
      <div className={`relative transition-all duration-500 ${!loaded ? "opacity-0 pointer-events-none" : "opacity-100"} ${!LIGHT_MODE ? "bg-slate-950 text-white" : ""}`}>
        {/*<div className={`transition-all z-20 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute` + (quickstartVisible && lang != null ? " opacity-100" : " opacity-0 pointer-events-none")}>*/}
        {/*  <QuickstartMenu config={config} setLang={setLang} lang={lang} setConfig={setConfig}></QuickstartMenu>*/}
        {/*</div>*/}

        <div className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (donateVisible && !quickstartVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <div className={`flex flex-col justify-center w-6/12 h-3/6 outline outline-1 ${LIGHT_MODE ? "outline-white" : "outline-slate-950"} rounded ${LIGHT_MODE ? "bg-white" : "bg-slate-950"}`}>
            <div className='flex flex-row justify-center'>
              <p className='ml-4 text-md text-center'>{localization.donation_text[lang]}</p>
            </div>
            <div className='flex justify-center mt-4 gap-2'>
              <Button variant="contained" color="secondary" className='w-48' onClick={() => { /* TODO: BUYMEACOFFEE LINK */ }}><Favorite className='mr-2' /><p className='text-xs'>Buy Me a Coffee</p></Button>
              <Button sx={{
                backgroundColor: "#fc4d50"
              }} variant="contained" className='w-48' onClick={() => { /* TODO: OPEN BOOTH LINK */ }}>
                <img src="/boothlogo.svg" width={24} className="mr-2"></img>
                <p className="mt-0.5"><p className='text-xs'>Booth.pm</p></p>
              </Button>
              <Button variant="contained" className='w-48' onClick={() => { setDonateVisible(false) }}><p className='text-xs'>{localization.close_menu[lang]}</p></Button>
            </div>
          </div>
        </div>

        <div className={'transition-all z-10 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (googleServersErrorVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <div className={`flex flex-col justify-center w-10/12 h-3/6 outline outline-1 ${LIGHT_MODE ? "outline-white" : "outline-slate-950"} outline-gray-200 rounded ${LIGHT_MODE ? "bg-white" : "bg-slate-950"}`}>
            <div className='flex flex-row justify-center'>
              <p className='ml-4 text-md text-center'>{localization.unable_to_access_google_servers[lang]}</p>
            </div>
            <div className='flex flex-row justify-center mt-4'>
              <Button variant="contained" className='w-32' onClick={() => { setGoogleServersErrorVisible(false) }}>{localization.close_menu[lang]}</Button>
            </div>
          </div>
        </div>

        {/*<div className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (settingsVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>*/}
        {/*  <div className={`flex flex-col justify-between  w-10/12 h-5/6 outline outline-1 ${LIGHT_MODE ? "outline-slate-400" : "outline-slate-950"} rounded bg-white`}>*/}
        {/*    <SettingsPage lang={lang} config={config} setConfig={setConfig} closeCallback={() => setSettingsVisible(false)} />*/}
        {/*  </div>*/}
        {/*</div>*/}
        {!quickstartVisible && changelogsVisible &&
          <div className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (changelogsVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
            <div className={`flex flex-col justify-between  w-10/12 h-5/6 outline outline-1 ${LIGHT_MODE ? "outline-slate-400" : "outline-slate-950"} rounded bg-white`}>
              <Changelogs light_mode={LIGHT_MODE} lang={lang} closeCallback={() => setChangelogsVisible(false)} />
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
                }} variant='outlined' className="ml-4 mr-2" value={MODE} onChange={(_) => {
                  /* TODO: Update mode change */
                }}>
                  <MenuItem value={0}>{localization.translation[lang]}</MenuItem>
                  <MenuItem value={1}>{localization.stt_only[lang]}</MenuItem>
                </Select>
                <IconButton sx={{
                  color: 'white',
                  '& .MuiSvgIcon-root': {
                    color: 'white'
                  }
                }} onClick={() => {
                  /* TODO: Toggle light mode */
                }}>
                  {LIGHT_MODE ? <NightsStay /> : <WbSunny />}
                </IconButton>
                <IconButton sx={{
                  color: 'white',
                  '& .MuiSvgIcon-root': {
                    color: 'white'
                  }
                }} onClick={() => { setQuickstartVisible(true); }}>
                  <Translate />
                </IconButton>
                <IconButton sx={{
                  color: 'white',
                  '& .MuiSvgIcon-root': {
                    color: 'white'
                  }
                }} onClick={() => { setSettingsVisible(true) }}>
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
