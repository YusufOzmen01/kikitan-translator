import * as React from "react"

import Box from '@mui/material/Box';
import { IconButton } from "@mui/material";

import { localization } from "../util/localization";

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import {
  info,
  error
} from '@tauri-apps/plugin-log';

import {
    Close
} from '@mui/icons-material';
import { Lang } from "../util/constants";

type ChangelogsProps = {
    closeCallback: () => void;
    lang: Lang;
    light_mode: boolean;
}

export default function Changelogs({ closeCallback, lang, light_mode }: ChangelogsProps) {
    const [changelog, setChangelog] = React.useState("")
    React.useEffect(() => {
        info("[CHANGELOG] Fetching changelogs...")
        fetch(`/changelogs/${lang}.md`).then((res) => res.text()).then((text) => {
            info("[CHANGELOG] Succesfully fetched changelogs!")
            setChangelog(text)
          })
        .catch(e => {
            error("[CHANGELOG] Error fetching changelogs: " + e)
        })
    }, [])

    return <>
        <Box sx={{ 
            width: '100%',
            '& .MuiSvgIcon-root': {
                color: light_mode ? 'black' : 'white'
            },
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: light_mode ? 'black' : 'white',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: light_mode ? 'black' : 'white',
            },
        }} className={`h-screen ${light_mode ? "" : "bg-slate-950 text-white"}`}>
            <Box className={`flex`} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <IconButton className="ml-2 mr-2" onClick={() => { closeCallback() }}>
                    <Close />
                </IconButton>

                <h1 className="ml-2 mt-[5px] text-xl font-semibold">{localization.changelogs[lang]}</h1>
            </Box>

            <Markdown remarkPlugins={[remarkGfm]} className="list-disc list-inside text-sm mt-4 ml-8 w-11/12 max-h-80 whitespace-pre text-wrap overflow-y-scroll">{changelog}</Markdown>
        </Box>
    </>
}