import * as React from "react"

import Box from '@mui/material/Box';
import { IconButton, Button } from "@mui/material";

import { localization } from "../util/localization";

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import {
    Close
} from '@mui/icons-material';

export default function Changelogs({ closeCallback, lang }) {
    const [changelog, setChangelog] = React.useState("")
    React.useEffect(() => {
        fetch(`/changelogs/${lang}.md`).then((res) => res.text()).then((text) => {
            setChangelog(text)
          })
    }, [])

    return <>
        <Box sx={{ width: '100%' }}>
            <Box className="flex" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <IconButton className="ml-2 mr-2" onClick={() => { closeCallback() }}>
                    <Close />
                </IconButton>

                <h1 className="ml-2 mt-[5px] text-xl font-semibold">{localization.changelogs[lang]}</h1>
            </Box>

            <Markdown remarkPlugins={[remarkGfm]} className="text-md mt-4 ml-8 w-11/12 max-h-80 whitespace-pre text-wrap overflow-y-scroll">{changelog}</Markdown>
        </Box>
    </>
}