import * as React from "react"

import Box from '@mui/material/Box';
import { IconButton, Button } from "@mui/material";

import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import {
    Close
} from '@mui/icons-material';

export default function Changelogs({ closeCallback, changelogTextEnglish, changelogTextJapanese, version }) {
    const [isJapanese, setIsJapanese] = React.useState(true)

    return <>
        <Box sx={{ width: '100%' }}>
            <Box className="flex" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <IconButton className="ml-2 mr-2" onClick={() => { closeCallback() }}>
                    <Close />
                </IconButton>
                
                <Button variant="contained" className="mr-2 ml-4 mt-1" onClick={() => { setIsJapanese(!isJapanese) }}>
                    {isJapanese ? "English" : "日本語"}
                </Button>

                <h1 className="ml-4 mt-1 text-2xl font-semibold">{isJapanese ? `v${version}の変更履歴` : `Changelog for v${version}`}</h1>
            </Box>

            <Markdown remarkPlugins={[remarkGfm]} className="text-lg mt-4 ml-8 w-11/12 max-h-80 whitespace-pre text-wrap overflow-y-scroll">{isJapanese ? changelogTextJapanese : changelogTextEnglish}</Markdown>
        </Box>
    </>
}