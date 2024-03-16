'use client'

import * as React from 'react';

import Kikitan from "./pages/Kikitan"

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Select, MenuItem, Switch } from '@mui/material';
import { invoke } from '@tauri-apps/api/tauri'

import {
  checkUpdate,
  installUpdate,
  onUpdaterEvent,
} from '@tauri-apps/api/updater'

function App() {
  const [translator, setTranslator] = React.useState(typeof window !== 'undefined' ? localStorage.getItem("translator") == null ? 0 : parseInt(localStorage.getItem("translator")) : null)
  const [ovr, setOvr] = React.useState(false)
  const [ovrSr, setOvrSr] = React.useState(false)
  const [vrc, setVrc] = React.useState(true)

  React.useEffect(() => {
    localStorage.setItem("translator", translator)

    checkUpdate().then(s => console.log(s))
  }, [translator])

  return (
    translator == null ? <></> : 
    <>
      <div className="flex flex-col h-screen">
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
              }} variant='outlined' className="ml-4" value={translator} onChange={(e) => {
                setTranslator(e.target.value)
              }}>
                <MenuItem value={0}>Google ML (Slow)</MenuItem>
                <MenuItem value={1}>Google Translate (Fast)</MenuItem>
              </Select>
            </div>

          </Toolbar>
        </AppBar>
        <div className='flex flex-1 items-center align-middle flex-col mt-16'>
          {Kikitan(ovrSr, vrc, translator)}
        </div>
      </div>
    </>
  )
}

export default App
