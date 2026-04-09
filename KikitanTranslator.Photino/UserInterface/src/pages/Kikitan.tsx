import * as React from "react";

import {
    Select,
    MenuItem,
    Button,
    TextField,
    IconButton,
    Tooltip,
    CircularProgress,
    Snackbar,
    Alert,
    Slide
} from "@mui/material";

import {
    X as XIcon,
    GitHub as GitHubIcon,
    Favorite as FavoriteIcon,
    KeyboardVoice as KeyboardVoiceIcon,
    PlayArrow as PlayArrowIcon,
    Pause as PauseIcon,
    Keyboard,
    History as HistoryIcon,
    Close as CloseIcon,
    Mic as MicIcon,
    Translate as TranslateIcon,
    SwapHoriz as SwapHorizIcon,
} from "@mui/icons-material";

import {
    langSource,
    langTo,
} from "../util/constants";

import { localization } from "../util/localization";
import {
    controlKikitan,
    getConfig,
    getMicrophones, manualTranslate,
    registerRecognitionCallback,
    registerStatusCallback,
    setConfig
} from "../util/photino.ts";

export default function Kikitan() {
    const [lang, setLang] = React.useState<"en" | "jp" | "cn" | "kr" | "tr">("en")
    const [sourceLanguage, setSourceLanguage] = React.useState("en")
    const [targetLanguage, setTargetLanguage] = React.useState("en")
    const [lightMode, setLightMode] = React.useState<boolean>(false)
    const [sttOnly, setSttOnly] = React.useState<boolean>(false)
    const [messageHistory, setMessageHistory] = React.useState<{ source: string, translation: string, timestamp: number }[]>([])
    
    const [detecting, setDetecting] = React.useState(false);
    const [srStatus, setSRStatus] = React.useState(true);
    const [srLoading, setSRLoading] = React.useState(false)
    
    const [detection, setDetection] = React.useState<string>("");
    const [translation, setTranslation] = React.useState("");

    const [microphones, setMicrophones] = React.useState<{name: string, default: boolean}[]>([])
    const [currentMicrophone, setCurrentMicrophone] = React.useState<string>("")

    const [showMessageHistory, setShowMessageHistory] = React.useState(false);

    const [textInputVisible, setTextInputVisible] = React.useState(false);
    const [textInputValue, setTextInputValue] = React.useState("");

    const textInputRef = React.useRef<HTMLInputElement>(null);

    const [notification, setNotification] = React.useState<{
        open: boolean;
        message: string;
        severity: "success" | "error" | "warning" | "info";
    }>({ open: false, message: "", severity: "info" });

    const showNotification = (message: string, severity: "success" | "error" | "warning" | "info" = "info") => {
        setNotification({ open: true, message, severity });
    };
    
    React.useEffect(() => {
        // @ts-ignore
        setInterval(async () => {
            const config = await getConfig();
            
            setLang(config.language);
            setSourceLanguage(config.source_language);
            setTargetLanguage(config.target_language);
            setCurrentMicrophone(config.microphone);
            setLightMode(config.light_mode)
            setSttOnly(config.speech_to_text_only)

            const mics = await getMicrophones();
            mics.sort((a, _) => a.default ? -1 : 1)
            
            if (mics.filter(a => a.name == config.microphone).length == 0) {
                showNotification(localization.microphone_updated[lang], "warning")
                
                setConfig("microphone", mics[0].name)
            }

            setMicrophones(mics);
        }, 100);
        
        registerRecognitionCallback((r, t, f) => {
            setDetecting(!f);
            setDetection(r);
            setTranslation(t);
            
            if (f) {
                var copy = messageHistory;
                
                if (copy.length >= 50) copy = copy.slice(1)

                copy.unshift({
                    source: r,
                    translation: t,
                    timestamp: Date.now()
                })
                
                localStorage.setItem("history", JSON.stringify(copy))
                setMessageHistory(copy)
            }
        });
        
        registerStatusCallback((status) => {
            console.log(status)
            
            setSRLoading(status == 1);
            setSRStatus(status == 2);
        });
        
        if (localStorage.getItem("history") != null) setMessageHistory(JSON.parse(localStorage.getItem("history")!))
    }, []);

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };

    return (
        <>
            <div id="main" className="relative transition-all">
                <div
                    id="message-history"
                    className={
                        "transition-all z-20 w-full h-64 flex backdrop-blur-sm bg-transparent justify-center items-center absolute" +
                        (showMessageHistory
                            ? " opacity-100"
                            : " opacity-0 pointer-events-none")
                    }
                >
                    <div
                        className={`flex flex-col w-10/12 h-96 outline outline-1 ${lightMode
                            ? "outline-white"
                            : "outline-slate-900"
                            } rounded ${lightMode ? "bg-white" : "bg-slate-950"
                            } p-4 overflow-hidden`}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2
                                className={`text-xl font-bold ${lightMode
                                    ? "text-black"
                                    : "text-white"
                                    }`}
                            >
                                {localization.message_history[lang]}
                            </h2>
                            <IconButton
                                onClick={() => setShowMessageHistory(false)}
                                sx={{
                                    color: lightMode
                                        ? "rgba(0, 0, 0, 0.87)"
                                        : "#ffffff",
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </div>

                        <div
                            className="overflow-y-auto flex-grow mb-4"
                            style={{ maxHeight: "calc(100% - 4rem)" }}
                        >
                            {messageHistory.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <span
                                        className={`text-sm italic ${lightMode
                                            ? "text-gray-500"
                                            : "text-gray-400"
                                            }`}
                                    >
                                        {localization.no_history[lang]}
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messageHistory.map(
                                        (item, index) => (
                                            <div
                                                key={index}
                                                className={`p-3 rounded-md ${lightMode
                                                    ? "bg-gray-100"
                                                    : "bg-slate-900"
                                                    }`}
                                            >
                                                <div
                                                    className={`text-xs mb-1 ${lightMode
                                                        ? "text-gray-500"
                                                        : "text-gray-400"
                                                        }`}
                                                >
                                                    {formatTimestamp(item.timestamp)}
                                                </div>
                                                <div
                                                    className={`font-medium ${lightMode
                                                        ? "text-black"
                                                        : "text-white"
                                                        }`}
                                                >
                                                    {item.source}
                                                </div>
                                                <div
                                                    className={`mt-1 ${lightMode
                                                        ? "text-gray-800"
                                                        : "text-gray-300"
                                                        }`}
                                                >
                                                    {item.translation}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div
                    className={
                        "transition-all z-20 w-full h-64 flex bg-transparent justify-center items-center absolute" +
                        (textInputVisible
                            ? " opacity-100"
                            : " opacity-0 pointer-events-none")
                    }
                >
                    <div
                        className={`flex flex-col justify-center w-7/12 h-2/6 outline outline-1 ${lightMode
                            ? "outline-white"
                            : "outline-slate-900"
                            } rounded ${lightMode ? "bg-white" : "bg-slate-950"
                            }`}
                    >
                        <div className="flex flex-row justify-center gap-2">
                            <TextField
                                slotProps={{
                                    inputLabel: {
                                        style: {
                                            color: lightMode
                                                ? "black"
                                                : "#94A3B8",
                                        },
                                    },
                                    htmlInput: {
                                        style: {
                                            color: lightMode
                                                ? "black"
                                                : "#fff",
                                        },
                                    },
                                }}
                                inputRef={textInputRef}
                                placeholder={localization.type_here[lang]}
                                className="mt-2 w-48"
                                value={textInputValue}
                                id="outlined-basic"
                                variant="outlined"
                                onKeyDown={(e) => {
                                    if (e.key == "Enter") {
                                        manualTranslate(textInputValue)

                                        setTextInputVisible(false);
                                        setTextInputValue("");
                                    }
                                }}
                                onChange={(e) => {
                                    setTextInputValue(e.target.value);
                                }}
                            />
                            <Button
                                variant="contained"
                                className="w-12"
                                onClick={() => {
                                    manualTranslate(textInputValue)
                                    
                                    setTextInputVisible(false);
                                    setTextInputValue("");
                                }}
                            >
                                {localization.send[lang]}
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                className="w-36"
                                onClick={() => {
                                    setTextInputVisible(false);
                                    setTextInputValue("");
                                }}
                            >
                                {localization.close_menu[lang]}
                            </Button>
                        </div>
                    </div>
                </div>

                <div id="main-boxes" className="z-10 flex align-middle">
                    <div>
                        <div
                            className={`mr-16 w-96 h-48 outline outline-1 transition-all rounded-md font-bold text-center ${detecting
                                ? "italic " + lightMode
                                    ? "text-slate-400 outline-slate-800"
                                    : "text-slate-200 outline-slate-400"
                                : lightMode
                                    ? "text-black"
                                    : "text-slate-200"
                                } ${srStatus ? "" : lightMode ? "bg-gray-400" : "bg-gray-700"}`}
                        >
                            <p className="align-middle">{detection}</p>
                        </div>
                        <div className="flex">
                            <Select
                                sx={{
                                    color: lightMode
                                        ? "black"
                                        : "white",
                                    textAlign: "right",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: lightMode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline":
                                    {
                                        borderColor: lightMode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "& .MuiSvgIcon-root": {
                                        color: lightMode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "&.Mui-disabled": {
                                        color: lightMode
                                            ? "black"
                                            : "white",
                                        "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: lightMode
                                                ? "black"
                                                : "#94A3B8",
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline":
                                        {
                                            borderColor: lightMode
                                                ? "black"
                                                : "#94A3B8",
                                        },
                                        "& .MuiSvgIcon-root": {
                                            color: lightMode
                                                ? "black"
                                                : "#94A3B8",
                                        },
                                    },
                                }}
                                MenuProps={{
                                    sx: {
                                        "& .MuiPaper-root": {
                                            backgroundColor: lightMode
                                                ? "#94A3B8"
                                                : "#020617",
                                        },
                                    },
                                }}
                                className="mt-4 ml-auto h-14"
                                value={sourceLanguage}
                                onChange={(e) => {
                                    setConfig("source_language", e.target.value)
                                }}
                            >
                                {langSource.map((element) => {
                                    return (
                                        <MenuItem
                                            sx={{
                                                color: lightMode
                                                    ? "black"
                                                    : "white",
                                            }}
                                            key={element.code}
                                            value={element.code}
                                        >
                                            {element.name[lang]}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                            <div className="mt-7">
                                <MicIcon className="ml-3" />
                                <Button
                                    onClick={() => {
                                        const new_t = sourceLanguage;
                                        const new_s = targetLanguage;

                                        setConfig("source_language", new_s)
                                        setConfig("target_language", new_t)
                                    }}
                                > <SwapHorizIcon /> </Button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className={`w-96 h-48 outline outline-1 transition-all rounded-md ${lightMode
                            ? "text-black outline-slate-800"
                            : "text-slate-200 outline-slate-400"
                            } font-bold text-center ${(srStatus && !sttOnly) ? "" : lightMode ? "bg-gray-400" : "bg-gray-700"
                            }`}>
                            <p className={`transition-all duration-300 align-middle`} >
                                {sttOnly ? localization.translation_disabled[lang] : translation}
                            </p>
                        </div>
                        <div>
                            <TranslateIcon className="mr-3" />
                            <Select
                                sx={{
                                    color: lightMode
                                        ? "black"
                                        : "white",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: lightMode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline":
                                    {
                                        borderColor: lightMode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "& .MuiSvgIcon-root": {
                                        color: lightMode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                }}
                                MenuProps={{
                                    sx: {
                                        "& .MuiPaper-root": {
                                            backgroundColor: lightMode
                                                ? "#94A3B8"
                                                : "#020617",
                                        },
                                    },
                                }}
                                className="mt-4"
                                value={targetLanguage}
                                onChange={(e) => {
                                    setConfig("target_language", e.target.value)
                                }}
                            >
                                {langTo.map((element) => {
                                    return (
                                        <MenuItem
                                            sx={{
                                                color: lightMode
                                                    ? "black"
                                                    : "white",
                                            }}
                                            key={element.code}
                                            value={element.code}
                                        >
                                            {element.name[lang]}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </div>
                    </div>
                </div>
            </div>
            <div id="buttons" className="mt-2 mb-2 flex gap-2">
                <Button
                    variant="outlined"
                    size="medium"
                    disabled={!srStatus}
                    onClick={() => {
                        if (!textInputVisible) {
                            textInputRef.current?.focus();
                            textInputRef.current?.select();
                        }
                        setTextInputVisible(!textInputVisible);
                    }}
                >
                    <p>{localization.text[lang]}</p>{" "}
                    {<Keyboard className="ml-2" fontSize="small" />}
                </Button>
                <Button
                    variant="outlined"
                    size="medium"
                    color={srStatus ? !srLoading ? "error" : "inherit" : "success"}
                    disabled={srLoading}
                    sx={{
                        '&.Mui-disabled': {
                            borderColor: lightMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(148, 163, 184, 0.5)',
                            color: lightMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(148, 163, 184, 0.5)',
                        },
                    }}
                    onClick={() => {
                        controlKikitan(!srStatus)
                    }}
                >
                    <p>
                        {!srStatus ? localization.start[lang] : !srLoading ? localization.stop[lang] : ""}
                    </p>
                    {srLoading ? (<CircularProgress color="inherit" size={16} />) : srStatus ? (<PauseIcon fontSize="small" />) : (<PlayArrowIcon fontSize="small" />)}
                </Button>
                {/* TODO: Message history */ true && (
                    <Tooltip title={localization.message_history[lang]}>
                        <Button
                            variant="outlined"
                            size="medium"
                            onClick={() => setShowMessageHistory(true)}
                        >
                            <HistoryIcon fontSize="small" />
                        </Button>
                    </Tooltip>
                )}
            </div>

            <div id="social-links" className="align-middle">
                <div id="default-mic" className="justify-center flex mb-2 ml-2">
                    <KeyboardVoiceIcon fontSize="small" className="mt-3" />
                    <Select
                        sx={{
                            color: lightMode
                                ? "black"
                                : "white",
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: lightMode
                                    ? "black"
                                    : "#94A3B8",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline":
                            {
                                borderColor: lightMode
                                    ? "black"
                                    : "#94A3B8",
                            },
                            "& .MuiSvgIcon-root": {
                                color: lightMode
                                    ? "black"
                                    : "#94A3B8",
                            },
                            "&.Mui-disabled": {
                                color: lightMode
                                    ? "black"
                                    : "white",
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: lightMode
                                        ? "black"
                                        : "#94A3B8",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline":
                                {
                                    borderColor: lightMode
                                        ? "black"
                                        : "#94A3B8",
                                },
                                "& .MuiSvgIcon-root": {
                                    color: lightMode
                                        ? "black"
                                        : "#94A3B8",
                                },
                            },
                        }}
                        MenuProps={{
                            sx: {
                                "& .MuiPaper-root": {
                                    backgroundColor: lightMode
                                        ? "#94A3B8"
                                        : "#020617",
                                },
                            },
                        }}
                        className="ml-4 h-12 w-52"
                        value={currentMicrophone}
                        onChange={(e) => {
                            setConfig("microphone", e.target.value)
                        }}
                    >
                        {microphones.map((element) => {
                            return (
                                <MenuItem
                                    sx={{
                                        color: lightMode
                                            ? "black"
                                            : "white",
                                    }}
                                    key={element.name}
                                    value={element.name}
                                >
                                    {(element.name.includes("(") && element.name.includes(")")) ? element.name.match(/\(([^)]+)\)/)?.[1] : element.name}{element.default ? ` (${localization.default[lang]})` : ""}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </div>
                <div className="mt-2 flex space-x-2 justify-center">
                    <Button
                        variant="contained"
                        size="small"
                        className="h-8"
                        onClick={() => {
                            open("https://twitter.com/marquina_osu");
                        }}
                    >
                        <XIcon fontSize="small" />
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        className="h-8"
                        onClick={() => {
                            open("https://buymeacoffee.com/sergiomarquina");
                        }}
                    >
                        <FavoriteIcon fontSize="small" />
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        className="h-8"
                        onClick={() => {
                            open(
                                "https://github.com/YusufOzmen01/kikitan-translator"
                            );
                        }}
                    >
                        <GitHubIcon fontSize="small" />
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        className="h-8"
                        onClick={() => {
                            open("https://discord.gg/jpkYCgpBGV");
                        }}
                    >
                        <img
                            src="/discordlogo.webp"
                            className="invert"
                            width={18}
                        />
                    </Button>
                </div>
            </div>
            <Snackbar
                open={notification.open}
                autoHideDuration={5000}
                onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                TransitionComponent={Slide}
            >
                <Alert
                    onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                    severity={notification.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </>
    );
}
