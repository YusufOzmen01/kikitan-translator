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
  GitHub,
  Settings,
  Translate,
  WbSunny,
  NightsStay,
  Favorite
} from '@mui/icons-material';

import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-shell'

import SettingsPage from './pages/Settings';
import Scroll from "./components/Scroll"

import { DEFAULT_CONFIG, load_config, update_config } from './util/config';
import { Lang } from './util/constants';
import { getVersion } from '@tauri-apps/api/app';

import Changelogs from './pages/Changelogs';

import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

import { localization } from './util/localization';

import translateGT from './translators/google_translate';

function App() {
  const [quickstartVisible, setQuickstartVisible] = React.useState(true)
  const [changelogsVisible, setChangelogsVisible] = React.useState(false)
  const [settingsVisible, setSettingsVisible] = React.useState(false)
  const [updateVisible, setUpdateVisible] = React.useState(false)
  const [donateVisible, setDonateVisible] = React.useState(false)
  const [googleServersErrorVisible, setGoogleServersErrorVisible] = React.useState(false)
  // const [whisperSetupVisible, setWhisperSetupVisible] = React.useState(false)
  const [whisperInitializingVisible, setWhisperInitializingVisible] = React.useState(0)

  const [quickstartPage, setQuickstartPage] = React.useState(0)

  const [config, setConfig] = React.useState(DEFAULT_CONFIG)
  const [lang, setLang] = React.useState<Lang>("en")
  const [appVersion, setAppVersion] = React.useState("")

  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    if (loaded) update_config(config)
  }, [config])

  React.useEffect(() => {
    getVersion().then((version) => {
      setAppVersion(version)
      setChangelogsVisible(localStorage.getItem("changelogsViewed") != version)

      setTimeout(() => localStorage.setItem("changelogsViewed", version), 1000)
    })

    const cfg = load_config()
    const language = localStorage.getItem("lang") as Lang | null

    setQuickstartVisible(localStorage.getItem("quickstartMenu") == null || language == null)
    setLang(language == null ? "en" : language)

    setConfig(cfg)

    check().then((update) => {
      setUpdateVisible(update != null)

      update?.downloadAndInstall().then(() => {
        relaunch()
      });
    });

    setWhisperInitializingVisible(cfg.recognizer == 1 ? 1 : 0)

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

  return (
    <>
      <div className={`relative transition-all duration-500 ${!loaded ? "opacity-0 pointer-events-none" : "opacity-100"} ${!config.light_mode ? "bg-slate-950 text-white" : ""}`}>
        <div className={`transition-all z-20 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute` + (quickstartVisible && lang != null ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <div className={`flex flex-col justify-between w-10/12 h-5/6 outline outline-2 rounded  ${!config.light_mode ? "bg-slate-950 outline-slate-950" : "bg-white outline-white"}`}>
            <div className='relative mt-2 ml-2 mr-2 h-64'>
              <div className={`absolute inset-0 transition-all flex justify-center ease-in-out ${quickstartPage == 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                <div className='absolute mt-28 flex flex-col items-center'>
                  <Scroll light_mode={config.light_mode}></Scroll>

                  <div className='mt-16 absolute flex flex-row items-center'>
                    <Translate className='mr-8 outline-2 ' />
                    <Select sx={{
                      color: config.light_mode ? 'black' : 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: config.light_mode ? 'black' : 'white',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: config.light_mode ? 'black' : 'white',
                      },
                    }} variant='outlined' className="mt-auto mr-8" value={lang} onChange={(e) => {
                      setLang(e.target.value as Lang)
                    }}>

                      <MenuItem value={"en"}>English</MenuItem>
                      <MenuItem value={"jp"}>日本語</MenuItem>
                      <MenuItem value={"cn"}>中文</MenuItem>
                      <MenuItem value={"kr"}>한국어</MenuItem>
                      <MenuItem value={"tr"}>Türkçe</MenuItem>
                    </Select>
                  </div>
                </div>
              </div>

              <div className={'absolute inset-0 transition-all flex justify-center ease-in-out ' + (quickstartPage == 1 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                <div className='absolute mt-2 flex flex-col items-center'>
                  <p className='text-xl bold text-center'>{localization.quickstart_osc[lang]}</p>
                  {quickstartPage == 1 &&
                    <video width={480} autoPlay loop className='mt-4'>
                      <source src="/OSC.mp4" type="video/mp4"></source>
                    </video>
                  }
                </div>
              </div>

              <div className={'absolute inset-0 transition-all flex flex-col items-center justify-center ease-in-out ' + (quickstartPage == 2 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                <div className='mt-2 mb-4'>
                  <p className='text-xl bold text-center'>{localization.windows_mic_settings[lang]}</p>
                  <p className='text-lg mt-20 text-center'>{localization.windows_mic_details[lang]}</p>
                </div>
                <Button disabled={quickstartPage != 2} className={'w-96 '} variant='contained' startIcon={<Settings />} onClick={() => { invoke("show_windows_audio_settings") }}>{localization.open_win_audio[lang]}</Button>
              </div>

              <div className={'absolute inset-0 transition-all flex justify-center ease-in-out ' + (quickstartPage == 3 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                <div className='absolute mt-2 flex flex-col items-center'>
                  <p className='text-xl bold text-center'>{localization.mode_selection[lang]}</p>
                  <img className='mt-4 w-[384px]' src={
                    {
                      en: "https://i.imgur.com/2OHmEcT.png",
                      jp: "https://i.imgur.com/yTqbY4c.png",
                      cn: "https://i.imgur.com/iByKH4k.png",
                      kr: "https://i.imgur.com/Gr6UpXO.png",
                      tr: "https://i.imgur.com/1we8FT4.png"
                    }[lang]
                  } width={240} />
                  <p className='text-lg mt-4 text-center'>{localization.mode_selection_details[lang]}</p>
                </div>
              </div>

              <div className={'absolute inset-0 transition-all space-y-2 flex flex-col items-center justify-center ease-in-out ' + (quickstartPage == 4 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                <div className='mt-4 mb-4'>
                  <p className='text-xl mt-8 bold text-center'>{localization.thank_you[lang]}</p>
                  <p className='text-lg mt-20 text-center'>{localization.thank_you_details[lang]}</p>
                </div>
                <Button disabled={quickstartPage != 4} className={'w-70 '} variant='contained' startIcon={< GitHub />} onClick={async () => { open("https://github.com/YusufOzmen01/kikitan-translator") }}>{localization.open_repo[lang]}</Button>
                <Button disabled={quickstartPage != 4} className={'w-48 '} variant='contained' onClick={async () => { setQuickstartVisible(false); window.localStorage.setItem("quickstartMenu", "true"); localStorage.setItem("lang", lang) }}>{localization.close_menu[lang]}</Button>
              </div>
            </div>
            <div className='mb-2 flex justify-center space-x-4'>
              <Button variant='contained' disabled={quickstartPage == 0} onClick={() => { setQuickstartPage(quickstartPage - 1) }}>{localization.previous[lang]}</Button>
              <Button className='ml-4' variant='contained' disabled={quickstartPage > 3} onClick={() => { setQuickstartPage(quickstartPage + 1) }}>{localization.next[lang]}</Button>
            </div>
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

        <div className={'transition-all z-10 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (whisperInitializingVisible > 0 ? " opacity-100" : " opacity-0 pointer-events-none")}>
          <div className={`flex flex-col justify-center w-10/12 h-3/6 outline outline-1 ${config.light_mode ? "outline-white" : "outline-slate-950"} outline-gray-200 rounded ${config.light_mode ? "bg-white" : "bg-slate-950"}`}>
            <div className={`transition-all w-10/12 absolute z-20 ${(whisperInitializingVisible == 1 ? "opacity-100" : "opacity-0 pointer-events-none")}`}>
              <div className='flex flex-col justify-center'>
                <div className='flex flex-row justify-center'>
                  <CircularProgress />
                  <p className='ml-4 mt-1 text-3xl text-center'>{localization.initializing_whisper[lang]}</p>
                </div>
                <p className='ml-4 mt-2 text-md text-center'>{localization.initializing_whisper_note[lang]}</p>
              </div>

              <div className='flex flex-row justify-center mt-4'>
                <Button variant="contained" color='error' onClick={() => {
                  setConfig({
                    ...config,
                    recognizer: 0
                  })

                  setTimeout(() => { window.location.reload() }, 50);
                }}>{localization.cancel_and_switch_back[lang]}</Button>
              </div>
            </div>

            <div className={`transition-all w-10/12 absolute z-30 ${(whisperInitializingVisible == 2 ? "opacity-100" : "opacity-0 pointer-events-none")}`}>
              <div className='flex flex-col justify-center'>
                <p className='ml-4 mt-1 text-3xl text-center'>{localization.error_initializing_whisper[lang]}</p>
                <p className='ml-4 mt-2 text-md text-center'>{localization.error_initializing_whisper_note[lang]}</p>
              </div>

              <div className='flex flex-row justify-center mt-4 gap-2'>
                <Button variant="contained" onClick={() => {
                  setTimeout(() => { window.location.reload() }, 50);
                }}>{localization.retry[lang]}</Button>

                <Button className='ml-2' variant="contained" color='error' onClick={() => {
                  setConfig({
                    ...config,
                    recognizer: 0
                  })

                  setTimeout(() => { window.location.reload() }, 50);
                }}>{localization.cancel_and_switch_back[lang]}</Button>
              </div>
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
                }} onClick={() => { setQuickstartVisible(true); setQuickstartPage(0) }}>
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
            {loaded && <Kikitan lang={lang} config={config} setConfig={setConfig} setWhisperInitializingVisible={setWhisperInitializingVisible}></Kikitan>}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
