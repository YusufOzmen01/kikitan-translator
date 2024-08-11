'use client'

import * as React from 'react';

import Kikitan from "./pages/Kikitan"

import {
  AppBar,
  Toolbar,
  Typography,
  Select,
  MenuItem,
  Switch,
  Button,
  IconButton
} from '@mui/material';

import {
  GitHub,
  Help,
  Settings
} from '@mui/icons-material';

import { invoke } from '@tauri-apps/api/tauri'
import { Command, open } from '@tauri-apps/api/shell'

import SettingsPage from './pages/Settings';

import { DEFAULT_CONFIG, load_config, update_config } from './util/config';
import { getVersion } from '@tauri-apps/api/app';
import Changelogs from './pages/Changelogs';

let ws = null

function App() {
  const [ovr, setOvr] = React.useState(false)
  const [ovrSpeechRecognition, setOvrSpeechRecognition] = React.useState(false)
  const [steamVRReady, setSteamVRReady] = React.useState(false)

  const [vrc, setVrc] = React.useState(true)

  const [quickstartVisible, setQuickstartVisible] = React.useState(typeof window !== 'undefined' ? localStorage.getItem("quickstartMenu") == null ? true : false : true)
  const [changelogsVisible, setChangelogsVisible] = React.useState(null)
  const [settingsVisible, setSettingsVisible] = React.useState(false)

  const [quickstartPage, setQuickstartPage] = React.useState(0)
  const [quickstartLanguageJapanese, setQuickstartLanguageJapanese] = React.useState(true)

  const [config, setConfig] = React.useState(DEFAULT_CONFIG)
  const [version, setVersion] = React.useState("")

  const [changelogTextEN, setChangelogTextEN] = React.useState("")
  const [changelogTextJP, setChangelogTextJP] = React.useState("")

  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    if (loaded) update_config(config)
  }, [config])

  React.useEffect(() => {
    fetch("/CHANGELOG_EN.md").then((res) => res.text()).then((text) => {
      setChangelogTextEN(text)
    })

    fetch("/CHANGELOG_JP.md").then((res) => res.text()).then((text) => {
      setChangelogTextJP(text)
    })

    setTimeout(() => {
      getVersion().then((version) => {
        setVersion(version)
        setChangelogsVisible(localStorage.getItem("changelogsViewed") != version)
  
        setTimeout(() => localStorage.setItem("changelogsViewed", version), 1000)
      })

      setConfig({ ...load_config() })

      setLoaded(true)
    }, 2000)
  }, [])

  return (
    <>
      <div className={`relative transition-all duration-500 ${!loaded ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        {quickstartVisible &&
          <div className={'transition-all z-10 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute'}>
            <div className='flex flex-col justify-between  w-10/12 h-5/6 outline outline-2 outline-white rounded bg-white'>
              <div className='relative mt-2 ml-2 mr-2 h-64'>
                <div className={'absolute inset-0 transition-all flex justify-center ease-in-out ' + (quickstartPage == 0 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                  <div className='absolute mt-2 flex flex-col items-center'>
                    <p className='text-xl bold text-center'>{quickstartLanguageJapanese ? "OSCを有効にしてください！" : "Make sure to enable OSC!"}</p>
                    {quickstartPage == 0 &&
                      <video width={480} autoPlay loop className='mt-4'>
                        <source src="/OSC.mp4" type="video/mp4"></source>
                      </video>
                    }
                  </div>
                </div>

                <div className={'absolute inset-0 transition-all flex flex-col items-center justify-center ease-in-out ' + (quickstartPage == 1 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                  <div className='mt-2 mb-4'>
                    <p className='text-xl bold text-center'>{quickstartLanguageJapanese ? "Windowsのデフォルトマイクの設定を確認してください！" : "Check your Windows default microphone settings!"}</p>
                    <p className='text-lg mt-20 text-center'>
                      {quickstartLanguageJapanese ?
                        "Windowsのマイク設定を確認してください。VRヘッドセットのマイク（または実際に使用しているマイク）が選択されている必要があります。マイクを変更した後にキキタンの再起動が必要です。"
                        :
                        "Make sure to check your Windows microphone settings. Your VR headset microphone (or your actual microphone) must be selected. Don't forget to restart Kikitan after changing the default microphone!"
                      }
                    </p>
                  </div>
                  <Button disabled={quickstartPage != 1} className={'w-96 '} variant='contained' startIcon={<Settings />} onClick={async () => { await new Command("open-windows-audio-settings", ["Start", "ms-settings:sound"]).spawn() }}>{quickstartLanguageJapanese ? "Windowsのオーディオ設定を開く" : "Open Windows Audio Settings"}</Button>
                </div>

                <div className={'absolute inset-0 transition-all flex justify-center  ease-in-out ' + (quickstartPage == 2 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                  <div className='absolute mt-2 flex flex-col items-center'>
                    <p className='text-xl bold text-center'>{quickstartLanguageJapanese ? "[VRのみ] SteamVR STT (音声からテキストへ) の使用方法" : "[VR ONLY] How to use SteamVR STT (Speech to Text)"}</p>
                    {quickstartPage == 2 &&
                      <video width={480} autoPlay loop className='mt-4'>
                        <source src="/STEAMVR.mp4" type="video/mp4"></source>
                      </video>
                    }
                  </div>
                </div>

                <div className={'absolute inset-0 transition-all flex justify-center  ease-in-out ' + (quickstartPage == 3 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                  <div className='absolute mt-2 flex flex-col items-center'>
                    <p className='text-xl bold text-center'>{quickstartLanguageJapanese ? "モードの選択" : "Mode selection"}</p>
                    <img className='mt-4' src="https://i.imgur.com/SQ5ju5r.png" width={240} />
                    <p className='text-lg mt-20 text-center'>
                      {quickstartLanguageJapanese ?
                        "ここからモードを変更できます。 翻訳では、発言内容とその翻訳の両方が VRChat に送信されます。 文字起こしでは、話した内容のみが VRChat に送信されます。"
                        :
                        "You can change the mode from here. Translation sends both what is said and its translation to VRChat. With transcription, only what is said is sent to VRChat."
                      }
                    </p>
                  </div>
                </div>

                <div className={'absolute inset-0 transition-all space-y-2 flex flex-col items-center justify-center ease-in-out ' + (quickstartPage == 4 ? "opacity-100" : "opacity-0 pointer-events-none")}>
                  <div className='mt-4 mb-4'>
                    <p className='text-xl mt-8 bold text-center'>{quickstartLanguageJapanese ? "Kikitanをご利用いただき、ありがとうございます！" : "Thank you for using Kikitan!"}</p>
                    <p className='text-lg mt-20 text-center'>
                      {quickstartLanguageJapanese ?
                        "キキタンはオープンソースプロジェクトです！このプロジェクトへのどんな支援も感謝します！"
                        :
                        "Kikitan is an open source project! Any support for this project would be appreciated!"
                      }
                    </p>
                  </div>
                  <Button disabled={quickstartPage != 4} className={'w-70 '} variant='contained' startIcon={< GitHub />} onClick={async () => { open("https://github.com/YusufOzmen01/kikitan-translator") }}>{quickstartLanguageJapanese ? "プロジェクトリポジトリを開く" : "Open the project repository"}</Button>
                  <Button disabled={quickstartPage != 4} className={'w-48 '} variant='contained' onClick={async () => { setQuickstartVisible(false); window.localStorage.setItem("quickstartMenu", true) }}>{quickstartLanguageJapanese ? "メニューを閉じる" : "Close the Menu"}</Button>
                </div>
              </div>
              <div className='mb-2 flex justify-center space-x-4'>
                <Button variant='contained' disabled={quickstartPage == 0} onClick={() => { setQuickstartPage(quickstartPage - 1) }}>{quickstartLanguageJapanese ? "前" : "Previous"}</Button>
                <Button variant='contained' onClick={() => { setQuickstartLanguageJapanese(!quickstartLanguageJapanese) }}>{!quickstartLanguageJapanese ? "日本語" : "English"}</Button>
                <Button variant='contained' disabled={quickstartPage > 3} onClick={() => { setQuickstartPage(quickstartPage + 1) }}>{quickstartLanguageJapanese ? "次" : "Next"}</Button>
              </div>
            </div>
          </div>
        }

        {settingsVisible &&
          <div className={'transition-all z-20 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (settingsVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
            <div className='flex flex-col justify-between  w-10/12 h-5/6 outline outline-2 outline-white rounded bg-white'>
              <SettingsPage config={config} setConfig={setConfig} closeCallback={() => setSettingsVisible(false)} />
            </div>
          </div>
        }

        {!quickstartVisible && changelogsVisible &&
          <div className={'transition-all z-20 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute' + (changelogsVisible ? " opacity-100" : " opacity-0 pointer-events-none")}>
            <div className='flex flex-col justify-between  w-10/12 h-5/6 outline outline-2 outline-white rounded bg-white'>
              <Changelogs version={version} changelogTextEnglish={changelogTextEN} changelogTextJapanese={changelogTextJP} closeCallback={() => setChangelogsVisible(false)} />
            </div>
          </div>
        }

        <div className="flex flex-col h-screen z-0">
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Kikitan Translator
              </Typography>

              <div className='flex'>
                <p className='mt-2'>VRChat OSC</p>
                <Switch color='secondary' className="ml-4 mr-2" checked={vrc} defaultChecked onChange={(e) => {
                  setVrc(e.target.checked)
                }} />
                <p className='mt-2'>SteamVR Connection</p>
                <Switch color='secondary' disabled={ovr && !steamVRReady} className="ml-4" checked={ovr} defaultChecked onChange={(e) => {
                  setOvr(e.target.checked)

                  if (e.target.checked) {
                    invoke("start_ovr", {}).then(() => {
                      console.log("Starting ovr...")

                      setTimeout(() => {
                        ws = new WebSocket("ws://127.0.0.1/ovr")
                        ws.onopen = () => {
                          console.log("OVR connection opened!")

                          setSteamVRReady(true)
                        }

                        ws.onmessage = (e) => {
                          if (e.data == "SRON" || e.data == "SROFF") {
                            setOvrSpeechRecognition(e.data == "SRON" ? true : e.data == "SROFF" ? false : ovrSpeechRecognition)

                            return
                          }

                          let param = e.data.split(" ")
                          let key = param[0]
                          let value = param[1]

                          update_config({ ...config, [key]: value })
                        }

                        ws.onerror = (e) => {
                          console.log(e)
                          invoke("kill_ovr", {}).then(() => console.log("Killing ovr process..."));

                          setOvr(false)
                          setSteamVRReady(false)
                        }
                      }, 3000)
                    })
                  } else {
                    invoke("kill_ovr", {}).then(() => console.log("Killing ovr process..."));

                    setSteamVRReady(false)
                  }
                }} />
              </div>
              <div className='flex'>
                <Select sx={{
                  color: 'white',
                  '& .MuiSvgIcon-root': {
                    color: 'white'
                  }
                }} variant='outlined' className="ml-4 mr-2" value={config.mode} onChange={(e) => {
                  setConfig({ ...config, mode: e.target.value })

                  setTimeout(() => { window.location.reload() }, 100)
                }}>
                  <MenuItem value={0}>{"Translate (翻訳)"}</MenuItem>
                  <MenuItem value={1}>{"Transcribe (文字起こし)"}</MenuItem>
                </Select>
                <IconButton sx={{
                  color: 'white',
                  '& .MuiSvgIcon-root': {
                    color: 'white'
                  }
                }} onClick={() => { setQuickstartVisible(true); setQuickstartPage(0) }}>
                  <Help />
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
          <div className='flex flex-1 items-center align-middle flex-col mt-16'>
            {loaded && <Kikitan sr_on={!settingsVisible && !quickstartVisible} ovr={ovrSpeechRecognition} vrc={vrc} config={config} setConfig={setConfig} ws={ws}></Kikitan>}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
