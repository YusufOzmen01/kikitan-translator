// @ts-ignore
import * as React from "react"

import Box from '@mui/material/Box';
import { IconButton } from "@mui/material";

import { localization } from "../util/localization";

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import {
    Close
} from '@mui/icons-material';
import {app_state} from "../util/constants";

type ChangelogsProps = {
    closeCallback: () => void;
    state: app_state;
    changelog: string;
}

export default function Changelogs({ closeCallback, state, changelog }: ChangelogsProps) {
    return <>
        <Box sx={{ 
            width: '100%',
            '& .MuiSvgIcon-root': {
                color: state.config.light_mode ? 'black' : 'white'
            },
            '& .MuiOutlinedInput-notchedOutline': {
                borderColor: state.config.light_mode ? 'black' : 'white',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: state.config.light_mode ? 'black' : 'white',
            },
        }} className={`h-screen ${state.config.light_mode ? "" : "bg-slate-950 text-white"}`}>
            <Box className={`flex`} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <IconButton className="ml-2 mr-2" onClick={() => { closeCallback() }}>
                    <Close />
                </IconButton>

                <h1 className="ml-2 mt-[5px] text-xl font-semibold">{localization.changelogs[state.config.language]}</h1>
            </Box>

            <Markdown remarkPlugins={[remarkGfm]} className="list-disc list-inside text-sm mt-4 ml-8 w-11/12 max-h-80 whitespace-pre text-wrap overflow-hidden">{changelog}</Markdown>
        </Box>
    </>
}