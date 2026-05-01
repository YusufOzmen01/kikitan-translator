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
    Slide,
    Switch,
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
    app_state,
    langSource,
    langTo,
} from "../util/constants";

import { localization } from "../util/localization";
import {
    controlKikitan,
    manualTranslate, openURL, registerMicrophoneChangedCallback, registerNotificationCallback,
    registerRecognitionCallback,
    setConfig
} from "../util/photino.ts";

export default function Kikitan({ state }: { state: app_state }) {
    const [messageHistory, setMessageHistory] = React.useState<{ source: string, translation: string, timestamp: number }[]>([])
    
    const [detecting, setDetecting] = React.useState(false);
    
    const [detection, setDetection] = React.useState<string>("");
    const [translation, setTranslation] = React.useState("");

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
    
    const getStatusColor = (): "success" | "inherit" | "error" => {
        // @ts-ignore
        return ["success", "inherit", "error"][state.status]
    }
    
    React.useEffect(() => {
        // @ts-ignore
        registerRecognitionCallback((r, t, f) => {
            if (r.length != 0) setDetection(r);
            if (t.length != 0) setTranslation(t);
            
            setDetecting(!f);
            
            if (f) {
                var copy = messageHistory;
                
                if (copy.length >= 50) copy = copy.slice(1)

                copy.unshift({
                    source: r,
                    translation: t,
                    timestamp: Date.now()
                })
                
                sessionStorage.setItem("history", JSON.stringify(copy))
                setMessageHistory(copy)
            }
        });
        
        registerMicrophoneChangedCallback(() => showNotification(localization.microphone_updated[state.config.language], "warning"))
        registerNotificationCallback((msg: string, level: number) => showNotification(msg, level == 1 ? "warning" : level == 2 ? "error" : level == 3 ? "success" : "info"))
        controlKikitan(true)
        
        if (sessionStorage.getItem("history") != null) setMessageHistory(JSON.parse(sessionStorage.getItem("history")!))
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
                        className={`flex flex-col w-10/12 h-96 outline outline-1 ${state.config.light_mode
                            ? "outline-white"
                            : "outline-slate-900"
                            } rounded ${state.config.light_mode ? "bg-white" : "bg-slate-950"
                            } p-4 overflow-hidden`}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2
                                className={`text-xl font-bold ${state.config.light_mode
                                    ? "text-black"
                                    : "text-white"
                                    }`}
                            >
                                {localization.message_history[state.config.language]}
                            </h2>
                            <IconButton
                                onClick={() => setShowMessageHistory(false)}
                                sx={{
                                    color: state.config.light_mode
                                        ? "rgba(0, 0, 0, 0.87)"
                                        : "#ffffff"
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
                                        className={`text-sm italic ${state.config.light_mode
                                            ? "text-gray-500"
                                            : "text-gray-400"
                                            }`}
                                    >
                                        {localization.no_history[state.config.language]}
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messageHistory.map(
                                        (item, index) => (
                                            <div
                                                key={index}
                                                className={`p-3 rounded-md ${state.config.light_mode
                                                    ? "bg-gray-100"
                                                    : "bg-slate-900"
                                                    }`}
                                            >
                                                <div
                                                    className={`text-xs mb-1 ${state.config.light_mode
                                                        ? "text-gray-500"
                                                        : "text-gray-400"
                                                        }`}
                                                >
                                                    {formatTimestamp(item.timestamp)}
                                                </div>
                                                <div
                                                    className={`font-medium ${state.config.light_mode
                                                        ? "text-black"
                                                        : "text-white"
                                                        }`}
                                                >
                                                    {item.source}
                                                </div>
                                                <div
                                                    className={`mt-1 ${state.config.light_mode
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
                        className={`flex flex-col justify-center w-7/12 h-2/6 outline outline-1 ${state.config.light_mode
                            ? "outline-white"
                            : "outline-slate-900"
                            } rounded ${state.config.light_mode ? "bg-white" : "bg-slate-950"
                            }`}
                    >
                        <div className="flex flex-row justify-center gap-2">
                            <TextField
                                slotProps={{
                                    inputLabel: {
                                        style: {
                                            color: state.config.light_mode
                                                ? "black"
                                                : "#94A3B8",
                                        },
                                    },
                                    htmlInput: {
                                        style: {
                                            color: state.config.light_mode
                                                ? "black"
                                                : "#fff",
                                        },
                                    },
                                }}
                                inputRef={textInputRef}
                                placeholder={localization.type_here[state.config.language]}
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
                                {localization.send[state.config.language]}
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
                                {localization.close_menu[state.config.language]}
                            </Button>
                        </div>
                    </div>
                </div>

                <div id="main-boxes" className="z-10 flex align-middle">
                    <div>
                        <div
                            className={`mr-16 w-96 h-48 outline outline-1 transition-all rounded-md font-bold text-center ${detecting
                                ? "italic " + state.config.light_mode
                                    ? "text-slate-400 outline-slate-800"
                                    : "text-slate-200 outline-slate-400"
                                : state.config.light_mode
                                    ? "text-black"
                                    : "text-slate-200"
                                } ${state.status == 2 ? "" : state.config.light_mode ? "bg-gray-400" : "bg-gray-700"}`}
                        >
                            <p className="align-middle">{detection}</p>
                        </div>
                        <div className="flex">
                            <Select
                                sx={{
                                    color: state.config.light_mode
                                        ? "black"
                                        : "white",
                                    textAlign: "right",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: state.config.light_mode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline":
                                    {
                                        borderColor: state.config.light_mode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "& .MuiSvgIcon-root": {
                                        color: state.config.light_mode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "&.Mui-disabled": {
                                        color: state.config.light_mode
                                            ? "black"
                                            : "white",
                                        "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: state.config.light_mode
                                                ? "black"
                                                : "#94A3B8",
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline":
                                        {
                                            borderColor: state.config.light_mode
                                                ? "black"
                                                : "#94A3B8",
                                        },
                                        "& .MuiSvgIcon-root": {
                                            color: state.config.light_mode
                                                ? "black"
                                                : "#94A3B8",
                                        },
                                    },
                                }}
                                MenuProps={{
                                    sx: {
                                        "& .MuiPaper-root": {
                                            backgroundColor: state.config.light_mode
                                                ? "#94A3B8"
                                                : "#020617",
                                        },
                                    },
                                }}
                                className="mt-4 ml-auto h-14"
                                value={state.config.source_language}
                                onChange={(e) => {
                                    setConfig("source_language", e.target.value)
                                }}
                            >
                                {langSource.map((element) => {
                                    return (
                                        <MenuItem
                                            sx={{
                                                color: state.config.light_mode
                                                    ? "black"
                                                    : "white",
                                            }}
                                            key={element.code}
                                            value={element.code}
                                        >
                                            {element.name[state.config.language]}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                            <div className="mt-7">
                                <MicIcon className="ml-3" />
                                <Button
                                    onClick={() => {
                                        setConfig("source_language", state.config.target_language)
                                        setConfig("target_language", state.config.source_language)
                                    }}
                                > <SwapHorizIcon /> </Button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className={`w-96 h-48 outline outline-1 transition-all rounded-md ${state.config.light_mode
                            ? "text-black outline-slate-800"
                            : "text-slate-200 outline-slate-400"
                            } font-bold text-center ${(state.status == 2 && !state.config.speech_to_text_only) ? "" : state.config.light_mode ? "bg-gray-400" : "bg-gray-700"
                            }`}>
                            <p className={`transition-all duration-300 align-middle`} >
                                {state.config.speech_to_text_only ? localization.translation_disabled[state.config.language] : translation}
                            </p>
                        </div>
                        <div>
                            <TranslateIcon className="mr-3" />
                            <Select
                                sx={{
                                    color: state.config.light_mode
                                        ? "black"
                                        : "white",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: state.config.light_mode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline":
                                    {
                                        borderColor: state.config.light_mode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "& .MuiSvgIcon-root": {
                                        color: state.config.light_mode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                }}
                                MenuProps={{
                                    sx: {
                                        "& .MuiPaper-root": {
                                            backgroundColor: state.config.light_mode
                                                ? "#94A3B8"
                                                : "#020617",
                                        },
                                    },
                                }}
                                className="mt-4"
                                value={state.config.target_language}
                                onChange={(e) => {
                                    setConfig("target_language", e.target.value)
                                }}
                            >
                                {langTo.map((element) => {
                                    return (
                                        <MenuItem
                                            sx={{
                                                color: state.config.light_mode
                                                    ? "black"
                                                    : "white",
                                            }}
                                            key={element.code}
                                            value={element.code}
                                        >
                                            {element.name[state.config.language]}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </div>
                    </div>
                </div>
            </div>
            <div id="buttons" className="mt-2 mb-2 flex gap-2">
                <Tooltip title={localization.text[state.config.language]}>
                    <Button
                        variant="outlined"
                        size="medium"
                        disabled={state.status != 2}
                        sx={{
                            "&.Mui-disabled": {
                                borderColor: state.config.light_mode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(148, 163, 184, 0.5)',
                                color: state.config.light_mode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(148, 163, 184, 0.5)',
                            }
                        }}
                        onClick={() => {
                            if (!textInputVisible) {
                                textInputRef.current?.focus();
                                textInputRef.current?.select();
                            }
                            setTextInputVisible(!textInputVisible);
                        }}
                    >
                        {<Keyboard fontSize="small" />}
                    </Button>
                </Tooltip>
                <Button
                    variant="outlined"
                    size="medium"
                    color={getStatusColor()}
                    disabled={state.status == 1}
                    sx={{
                        '&.Mui-disabled': {
                            borderColor: state.config.light_mode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(148, 163, 184, 0.5)',
                            color: state.config.light_mode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(148, 163, 184, 0.5)',
                        },
                    }}
                    onClick={() => {
                        controlKikitan(state.status == 0)
                    }}
                >
                    <p className="mr-2">
                        {state.status == 0 ? localization.start[state.config.language] : state.status == 2 ? localization.stop[state.config.language] : ""}
                    </p>
                    {state.status == 1 ? (<CircularProgress color="inherit" size={16} />) : state.status == 2 ? (<PauseIcon fontSize="small" />) : (<PlayArrowIcon fontSize="small" />)}
                </Button>
                <Tooltip title={localization.message_history[state.config.language]}>
                    <Button
                        variant="outlined"
                        size="medium"
                        sx={{
                            "&.Mui-disabled": {
                                borderColor: state.config.light_mode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(148, 163, 184, 0.5)',
                                color: state.config.light_mode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(148, 163, 184, 0.5)',
                            }
                        }}
                        disabled={messageHistory.length == 0}
                        onClick={() => setShowMessageHistory(true)}
                    >
                        <HistoryIcon fontSize="small" />
                    </Button>
                </Tooltip>
            </div>

            <div id="social-links" className="align-middle">
                <div className="justify-center flex mb-2">
                    <Tooltip title={state.is_linux ? localization.desktop_translation_warning[state.config.language] : ""}>
                        <Switch sx={{
                            '& .MuiSwitch-track': {
                                color: 'white',
                                backgroundColor: 'gray'
                            }
                        }} checked={state.config.desktop_translation} disabled={state.is_linux} onChange={e => setConfig("desktop_translation", e.target.checked)}></Switch>
                    </Tooltip>
                    <p className={`${state.config.desktop_translation ? "" : "opacity-50"} mb-2 mt-[0.4rem]`}>{state.config.desktop_translation ? localization.disable_desktop_capture[state.config.language] : localization.enable_desktop_capture[state.config.language]}</p>
                    
                </div>
                <div id="default-mic" className="justify-center flex mb-2 ml-2">
                    <KeyboardVoiceIcon fontSize="small" className="mt-3" />
                    <Select
                        sx={{
                            color: state.config.light_mode
                                ? "black"
                                : "white",
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: state.config.light_mode
                                    ? "black"
                                    : "#94A3B8",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline":
                            {
                                borderColor: state.config.light_mode
                                    ? "black"
                                    : "#94A3B8",
                            },
                            "& .MuiSvgIcon-root": {
                                color: state.config.light_mode
                                    ? "black"
                                    : "#94A3B8",
                            },
                            "&.Mui-disabled": {
                                color: state.config.light_mode
                                    ? "black"
                                    : "white",
                                "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: state.config.light_mode
                                        ? "black"
                                        : "#94A3B8",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline":
                                {
                                    borderColor: state.config.light_mode
                                        ? "black"
                                        : "#94A3B8",
                                },
                                "& .MuiSvgIcon-root": {
                                    color: state.config.light_mode
                                        ? "black"
                                        : "#94A3B8",
                                },
                            },
                        }}
                        MenuProps={{
                            sx: {
                                "& .MuiPaper-root": {
                                    backgroundColor: state.config.light_mode
                                        ? "#94A3B8"
                                        : "#020617",
                                },
                            },
                        }}
                        className="ml-4 h-12 w-52"
                        value={state.config.microphone}
                        onChange={(e) => {
                            console.log(e.target.value)

                            setConfig("microphone", e.target.value)
                        }}
                    >
                        {state.microphones.map((element) => {
                            return (
                                <MenuItem
                                    sx={{
                                        color: state.config.light_mode
                                            ? "black"
                                            : "white",
                                    }}
                                    key={element.name}
                                    value={element.name}
                                >
                                    {(element.name.includes("(") && element.name.includes(")")) ? element.name.match(/\(([^)]+)\)/)?.[1] : element.name}{element.default ? ` (${localization.default[state.config.language]})` : ""}
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
                            openURL("https://twitter.com/marquina_osu");
                        }}
                    >
                        <XIcon fontSize="small" />
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        className="h-8"
                        onClick={() => {
                            openURL("https://buymeacoffee.com/sergiomarquina");
                        }}
                    >
                        <FavoriteIcon fontSize="small" />
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        className="h-8"
                        onClick={() => {
                            openURL(
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
                            openURL("https://discord.gg/jpkYCgpBGV");
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
