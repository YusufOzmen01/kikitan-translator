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
  CircularProgress,
  Box
} from '@mui/material';

import {
  Settings,
  Translate,
  WbSunny,
  NightsStay,
  Favorite,
  Close
} from '@mui/icons-material';

import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-shell'

import SettingsPage from './pages/Settings';


import { DEFAULT_CONFIG, load_config, update_config } from './util/config';
import { ANNOUNCEMENT_GIST_URL, Lang } from './util/constants';
import { getVersion } from '@tauri-apps/api/app';

import Changelogs from './pages/Changelogs';

import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

import { localization } from './util/localization';

import translateGT from './translators/google_translate';
import QuickstartMenu from './components/Quickstart';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Announcement = {
  show: boolean,
  date: string,
  en: string,
  jp: string,
  kr: string,
  cn: string,
  tr: string
}

function App() {
  const [quickstartVisible, setQuickstartVisible] = React.useState(true)
  const [changelogsVisible, setChangelogsVisible] = React.useState(false)
  const [settingsVisible, setSettingsVisible] = React.useState(false)
  const [updateVisible, setUpdateVisible] = React.useState(false)
  const [donateVisible, setDonateVisible] = React.useState(false)
  const [googleServersErrorVisible, setGoogleServersErrorVisible] = React.useState(false)

  const [config, setConfig] = React.useState(DEFAULT_CONFIG)
  const [lang, setLang] = React.useState<Lang>("en")
  const [appVersion, setAppVersion] = React.useState("")

  const [loaded, setLoaded] = React.useState(false)
  const [announcementVisible, setAnnouncementVisible] = React.useState(false)
  const [announcementData, setAnnouncementData] = React.useState<Announcement>()

  React.useEffect(() => {
    if (loaded) update_config(config)
  }, [config])

  React.useEffect(() => {
    const cfg = load_config()
    const language = localStorage.getItem("lang") as Lang | null

    setQuickstartVisible(localStorage.getItem("quickstartMenu") == null || language == null)
    if (!(localStorage.getItem("quickstartMenu") == null || language == null)) {
      getVersion().then((version) => {
        setAppVersion(version)
        setChangelogsVisible(localStorage.getItem("changelogsViewed") != version)

        setTimeout(() => localStorage.setItem("changelogsViewed", version), 1000)
      })
    }

    setLang(language == null ? "en" : language)
    setConfig(cfg)

    check().then((update) => {
      setUpdateVisible(update != null)

      update?.downloadAndInstall().then(() => {
        relaunch()
      });
    });

    translateGT("Hello, how are you?", "en-US", "tr-TR").then((out) => { console.log("Can access to Google servers: " + out) }).catch(err => {
      console.log(err)

      setGoogleServersErrorVisible(true)
    })

    invoke("start_vrc_listener")

    setTimeout(() => setLoaded(true), 300);

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

  React.useEffect(() => {
    if (!quickstartVisible) {
      fetch(ANNOUNCEMENT_GIST_URL).then(async data => {
        const json = (await data.json()) as Announcement

        setAnnouncementVisible(json.show ? localStorage.getItem("last-viewed-announcement")! == json.date ? false : true : false)
        setAnnouncementData(json)
        localStorage.setItem("last-viewed-announcement", json.date.toString());
      })

      getVersion().then((version) => {
        setAppVersion(version)
        setChangelogsVisible(localStorage.getItem("changelogsViewed") != version)

        setTimeout(() => localStorage.setItem("changelogsViewed", version), 1000)
      })
    }
  }, [quickstartVisible])

  return (
    <>
      <div className={`relative transition-all duration-500 ${!loaded ? "opacity-0 pointer-events-none" : "opacity-100"} ${!config.light_mode ? "bg-slate-950 text-white" : ""}`}>
        <div className={`transition-all z-20 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute` + (quickstartVisible && lang != null ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <QuickstartMenu config={config} setQuickstartVisible={setQuickstartVisible} setLang={setLang} lang={lang} setConfig={setConfig}></QuickstartMenu>
        </div>

        <div className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + ((!quickstartVisible && announcementVisible) ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <div className={`flex flex-col justify-between w-10/12 h-5/6 outline outline-1 ${config.light_mode ? "outline-slate-400" : "outline-slate-950"} rounded bg-white`}>
            <Box sx={{
              width: '100%',
              '& .MuiSvgIcon-root': {
                color: config.light_mode ? 'black' : 'white'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: config.light_mode ? 'black' : 'white',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: config.light_mode ? 'black' : 'white',
              },
            }} className={`h-screen ${config.light_mode ? "" : "bg-slate-950 text-white"}`}>
              <Box className={`flex`} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <IconButton className="ml-2 mr-2" onClick={() => { setAnnouncementVisible(false) }}>
                  <Close />
                </IconButton>

                <h1 className="ml-2 mt-[5px] text-xl font-semibold">{localization.announcement[lang]}</h1>
              </Box>
              <Markdown remarkPlugins={[remarkGfm]} className="list-disc list-inside text-sm mt-4 ml-8 w-11/12 max-h-80 whitespace-pre text-wrap overflow-y-scroll">{announcementData?.[lang]}</Markdown>
            </Box>
          </div>
        </div>

        <div className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (updateVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <div className={`flex flex-col justify-center w-10/12 h-5/6 outline outline-1 ${config.light_mode ? "outline-white" : "outline-slate-950"} rounded ${config.light_mode ? "bg-white" : "bg-slate-950"}`}>
            <div className='flex flex-row justify-center'>
              <CircularProgress></CircularProgress>
              <p className='ml-4 text-4xl'>{localization.updating[lang]}</p>
            </div>
          </div>
        </div>

        <div className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (donateVisible && !quickstartVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <div className={`flex flex-col justify-center w-6/12 h-3/6 outline outline-1 ${config.light_mode ? "outline-white" : "outline-slate-950"} rounded ${config.light_mode ? "bg-white" : "bg-slate-950"}`}>
            <div className='flex flex-row justify-center'>
              <p className='ml-4 text-md text-center'>{localization.donation_text[lang]}</p>
            </div>
            <div className='flex justify-center mt-4'>
              <Button variant="contained" color="secondary" className='w-48' onClick={() => { open("https://buymeacoffee.com/sergiomarquina") }}><Favorite className='mr-2' /> {localization.donate[lang]}</Button>
              <div className='w-2'></div>
              <Button variant="contained" className='w-48' onClick={() => { setDonateVisible(false) }}>{localization.close_menu[lang]}</Button>
            </div>
          </div>
        </div>

        <div className={'transition-all z-10 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (googleServersErrorVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <div className={`flex flex-col justify-center w-10/12 h-3/6 outline outline-1 ${config.light_mode ? "outline-white" : "outline-slate-950"} outline-gray-200 rounded ${config.light_mode ? "bg-white" : "bg-slate-950"}`}>
            <div className='flex flex-row justify-center'>
              <p className='ml-4 text-md text-center'>{localization.unable_to_access_google_servers[lang]}</p>
            </div>
            <div className='flex flex-row justify-center mt-4'>
              <Button variant="contained" className='w-32' onClick={() => { setGoogleServersErrorVisible(false) }}>{localization.close_menu[lang]}</Button>
            </div>
          </div>
        </div>

        <div className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (settingsVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <div className={`flex flex-col justify-between  w-10/12 h-5/6 outline outline-1 ${config.light_mode ? "outline-slate-400" : "outline-slate-950"} rounded bg-white`}>
            <SettingsPage lang={lang} config={config} setConfig={setConfig} closeCallback={() => setSettingsVisible(false)} />
          </div>
        </div>
        {!quickstartVisible && changelogsVisible &&
          <div className={'transition-all z-30 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (changelogsVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
            <div className={`flex flex-col justify-between  w-10/12 h-5/6 outline outline-1 ${config.light_mode ? "outline-slate-400" : "outline-slate-950"} rounded bg-white`}>
              <Changelogs light_mode={config.light_mode} lang={lang} closeCallback={() => setChangelogsVisible(false)} />
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
                }} variant='outlined' className="ml-4 mr-2" value={config.mode} onChange={(e) => {
                  setConfig({ ...config, mode: parseInt(e.target.value.toString()) })
                  setTimeout(() => { setLoaded(false) }, 100)

                  setTimeout(() => { window.location.reload() }, 300)
                }}>
                  <MenuItem value={0}>{localization.translation[lang]}</MenuItem>
                  <MenuItem value={1}>{localization.transcription[lang]}</MenuItem>
                </Select>
                <IconButton sx={{
                  color: 'white',
                  '& .MuiSvgIcon-root': {
                    color: 'white'
                  }
                }} onClick={() => {
                  setConfig({
                    ...config, light_mode: !config.light_mode
                  })
                }}>
                  {config.light_mode ? <NightsStay /> : <WbSunny />}
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
            {loaded && <Kikitan lang={lang} config={config} setConfig={setConfig} settingsVisible={settingsVisible} setSettingsVisible={setSettingsVisible}></Kikitan>}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
