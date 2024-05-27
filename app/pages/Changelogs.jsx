import * as React from "react"

import Box from '@mui/material/Box';
import { IconButton  } from "@mui/material";

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import {
    Close
} from '@mui/icons-material';

export default function Changelogs({ closeCallback, changelogText, version }) {
    return <>
        <Box sx={{ width: '100%' }}>
            <Box className="flex" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <h1 className="ml-4 mt-2 text-2xl font-semibold">Changelog for v{version}</h1>

                <IconButton className="ml-auto mr-2" onClick={() => { closeCallback() }}>
                    <Close />
                </IconButton>
            </Box>
            
            <Markdown remarkPlugins={[remarkGfm]} className="text-lg mt-10 ml-8 w-11/12">
                {changelogText}
            </Markdown>
        </Box>
    </>
}