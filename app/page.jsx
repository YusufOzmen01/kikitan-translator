'use client'

import * as React from 'react';

import Kikitan from "./pages/Kikitan/Kikitan"

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

function App() {
  const [translator, setTranslator] = React.useState(typeof window !== 'undefined' ? localStorage.getItem("translator") == null ? 0 : parseInt(localStorage.getItem("translator")) : null)
  const [ovr, setOvr] = React.useState(false)
  const [ovrSr, setOvrSr] = React.useState(false)
  const [vrc, setVrc] = React.useState(true)
  const [showQuickstart, setShowQuickstart] = React.useState(typeof window !== 'undefined' ? localStorage.getItem("quickstart") == null ? true : false : true)
  const [quickstartPage, setQuickstartPage] = React.useState(0)
  const [quickstartLanguageJapanese, setQuickstartLanguageJapanese] = React.useState(true)

  React.useEffect(() => {
    localStorage.setItem("translator", translator)
  }, [translator])

  return (
    translator == null ? <></> :
      <>
        <div className='relative'>
          {showQuickstart &&
            <div className={'transition-all z-10 w-full h-screen flex backdrop-blur-sm bg-transparent justify-center items-center absolute'}>
              <div className='flex flex-col justify-between  w-10/12 h-5/6 outline outline-2 outline-white rounded bg-white'>
                <div className='relative mt-2 ml-2 mr-2 h-64'>
                  <div className={'absolute inset-0 transition-all flex justify-center  ease-in-out ' + (quickstartPage == 0 ? "opacity-100" : "opacity-0")}>
                    <div className='absolute mt-2 flex flex-col items-center'>
                      <p className='text-xl bold text-center'>{quickstartLanguageJapanese ? "OSCを有効にしてください！" : "Make sure to enable OSC!"}</p>
                      {quickstartPage == 0 &&
                        <video width={480} autoPlay loop className='mt-4'>
                          <source src="/OSC.mp4" type="video/mp4"></source>
                        </video>
                      }
                    </div>
                  </div>

                  <div className={'absolute inset-0 transition-all flex flex-col items-center justify-center ease-in-out ' + (quickstartPage == 1 ? "opacity-100" : "opacity-0")}>
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

                  <div className={'absolute inset-0 transition-all flex justify-center  ease-in-out ' + (quickstartPage == 2 ? "opacity-100" : "opacity-0")}>
                    <div className='absolute mt-2 flex flex-col items-center'>
                      <p className='text-xl bold text-center'>{quickstartLanguageJapanese ? "SteamVR STT (音声からテキストへ) の使用方法" : "How to use SteamVR STT (Speech to Text)"}</p>
                      {quickstartPage == 2 &&
                        <video width={480} autoPlay loop className='mt-4'>
                          <source src="/STEAMVR.mp4" type="video/mp4"></source>
                        </video>
                      }
                    </div>
                  </div>

                  <div className={'absolute inset-0 transition-all space-y-2 flex flex-col items-center justify-center ease-in-out ' + (quickstartPage == 3 ? "opacity-100" : "opacity-0")}>
                    <div className='mt-4 mb-4'>
                      <p className='text-xl mt-8 bold text-center'>{quickstartLanguageJapanese ? "Kikitanをご利用いただき、ありがとうございます！" : "Thank you for using Kikitan!"}</p>
                      <p className='text-lg mt-20 text-center'>
                        {quickstartLanguageJapanese ?
                          "Kikitanはオープンソースプロジェクトです。ご自由に貢献したり、フォークしたり、自分のアイデアを活かしたりしてください！プロジェクトへのいかなる助けも本当に感謝します！"
                          :
                          "Kikitan is an open source project. Feel free to contribute, fork and do your own stuff on it! I would really appreciate any help on the project!"
                        }
                      </p>
                    </div>
                    <Button disabled={quickstartPage != 3} className={'w-70 '} variant='contained' startIcon={< GitHub />} onClick={async () => { open("https://github.com/YusufOzmen01/kikitan-translator") }}>{quickstartLanguageJapanese ? "プロジェクトリポジトリを開く" : "Open the project repository"}</Button>
                    <Button disabled={quickstartPage != 3} className={'w-48 '} variant='contained' onClick={async () => { setShowQuickstart(false); window.localStorage.setItem("quickstart", true) }}>{quickstartLanguageJapanese ? "メニューを閉じる" : "Close the Menu"}</Button>
                  </div>
                </div>
                <div className='mb-2 flex justify-center space-x-4'>
                  <Button variant='contained' disabled={quickstartPage == 0} onClick={() => { setQuickstartPage(quickstartPage - 1) }}>{quickstartLanguageJapanese ? "前" : "Previous"}</Button>
                  <Button onClick={() => { setQuickstartLanguageJapanese(!quickstartLanguageJapanese) }}>{!quickstartLanguageJapanese ? "日本語" : "English"}</Button>
                  <Button variant='contained' disabled={quickstartPage > 2} onClick={() => { setQuickstartPage(quickstartPage + 1) }}>{quickstartLanguageJapanese ? "次" : "Next"}</Button>
                </div>
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
                  <p className='mt-2'>SteamVR STT</p>
                  <Switch color='secondary' className="ml-4" checked={ovr} defaultChecked onChange={(e) => {
                    setOvr(e.target.checked)

                    if (e.target.checked) {
                      invoke("start_ovr", {}).then(() => {
                        console.log("Starting ovr...")

                        setTimeout(() => {
                          let ws = new WebSocket("ws://127.0.0.1/ovr")
                          ws.onopen = () => {
                            console.log("OVR connection opened!")
                          }

                          ws.onmessage = (e) => {
                            setOvrSr(e.data == "SRON" ? true : e.data == "SROFF" ? false : ovrSr)
                          }

                          ws.onerror = (e) => {
                            console.log(e)

                            setOvr(false)
                          }
                        }, 3000)
                      })
                    } else {
                      invoke("kill_ovr", {}).then(() => console.log("Killing ovr process..."));
                    }
                  }} />
                </div>
                <div className='flex'>
                  <Select sx={{
                    color: 'white',
                    '& .MuiSvgIcon-root': {
                      color: 'white'
                    }
                  }} variant='outlined' className="ml-4 mr-2" value={translator} onChange={(e) => {
                    setTranslator(e.target.value)
                  }}>
                    <MenuItem value={0}>Google Scripts</MenuItem>
                    <MenuItem value={1}>Google Translate</MenuItem>
                  </Select>
                  <IconButton sx={{
                    color: 'white',
                    '& .MuiSvgIcon-root': {
                      color: 'white'
                    }
                  }} onClick={() => { setShowQuickstart(true); setQuickstartPage(0) }}>
                    <Help />
                  </IconButton>
                </div>
              </Toolbar>
            </AppBar>
            <div className='flex flex-1 items-center align-middle flex-col mt-16'>
              {Kikitan(ovrSr, vrc, translator)}
            </div>
          </div>
        </div>
      </>
  )
}

export default App
