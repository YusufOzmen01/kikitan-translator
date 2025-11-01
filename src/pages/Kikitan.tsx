/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";

import {
    Select,
    MenuItem,
    Button,
    TextField,
    IconButton,
    Tooltip,
    Switch,
} from "@mui/material";

import { info, error, warn } from "@tauri-apps/plugin-log";

import {
    X as XIcon,
    GitHub as GitHubIcon,
    SwapHoriz as SwapHorizIcon,
    Favorite as FavoriteIcon,
    KeyboardVoice as KeyboardVoiceIcon,
    PlayArrow as PlayArrowIcon,
    Pause as PauseIcon,
    Keyboard,
    Circle,
    History as HistoryIcon,
    Close as CloseIcon,
} from "@mui/icons-material";

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-shell";

import {
    calculateMinWaitTime,
    Lang,
    langSource,
    langTo,
} from "../util/constants";

import { Config, MessageHistoryItem } from "../util/config";
import { Recognizer } from "../recognizers/recognizer";
import { WebSpeech } from "../recognizers/WebSpeech";

import { localization } from "../util/localization";
import { Gemini, GeminiState } from "../recognizers/Gemini";
import { send_notification_text } from "../util/overlay";
import {
    send_user_recognition,
    send_user_translation,
    send_desktop_recognition,
    send_desktop_translation,
} from "../util/data_out";

type KikitanProps = {
    config: Config;
    setConfig: (config: Config) => void;
    setGeminiErrorShown: (state: boolean) => void;
    lang: Lang;
    settingsVisible: boolean;
};

let sr: Recognizer | null = null;
let desktopSR: Recognizer | null = null;
let detectionQueue: string[][] = [];
let lock = false;

export default function Kikitan({
    config,
    setConfig,
    lang,
    settingsVisible,
    setGeminiErrorShown
}: KikitanProps) {
    const [detecting, setDetecting] = React.useState(false);
    const [srStatus, setSRStatus] = React.useState(true);
    const [vrcMuted, setVRCMuted] = React.useState(false);
    const [startedSpeaking, setStartedSpeaking] = React.useState(false);

    const [result, setResult] = React.useState<string[]>([]);
    const [detection, setDetection] = React.useState<string>("");
    const [translated, setTranslated] = React.useState("");
    const [desktopResult, setDesktopResult] = React.useState("");

    const [defaultMicrophone, setDefaultMicrophone] = React.useState(
        localization.waiting_for_mic_access[lang]
    );
    const [lastDefaultMicrophone, setLastDefaultMicrophone] =
        React.useState("");

    const [triggerUpdate, setTriggerUpdate] = React.useState(false);

    const [sourceLanguage, setSourceLanguage] = React.useState(
        config.source_language
    );
    const [targetLanguage, setTargetLanguage] = React.useState(
        config.target_language
    );

    const [languageUpdate, setLanguageUpdate] = React.useState(false);

    const [geminiSRStatus, setGeminiSRStatus] = React.useState<GeminiState>({
        connected: false,
        error: false,
        connection_init_time: 0,
        connection_established_time: 0,
    });
    const [geminiDesktopStatus, setGeminiDesktopStatus] =
        React.useState<GeminiState>({
            connected: false,
            error: false,
            connection_init_time: 0,
            connection_established_time: 0,
        });

    const [statusTrigger, setStatusTrigger] = React.useState(false);

    const [showMessageHistory, setShowMessageHistory] = React.useState(false);

    const [geminiSRInterval, setGeminiSRInterval] =
        React.useState<NodeJS.Timeout | null>(null);
    const [geminiDesktopInterval, setGeminiDesktopInterval] =
        React.useState<NodeJS.Timeout | null>(null);

    const [textInputVisible, setTextInputVisible] = React.useState(false);
    const [textInputValue, setTextInputValue] = React.useState("");

    const textInputRef = React.useRef<HTMLInputElement>(null);

    const setGeminiAsSR = () => {
        sr = new Gemini(
            sourceLanguage,
            targetLanguage,
            config.gemini_settings.gemini_api_key,
            !config.gemini_settings.microphone_capture,
            config.language_settings.japanese_omit_questionmark
        );
        info("[SR] Using Gemini for recognition");

        setGeminiSRInterval(
            setInterval(() => {
                setGeminiSRStatus(sr?.status() as GeminiState);

                setStatusTrigger(!statusTrigger);
            }, 100)
        );

        sr.onResult((result: string[], isFinal: boolean) => {
            setDetecting(!isFinal);
            setResult(result);
        });
    };

    const enableDesktopCapture = () => {
        desktopSR?.stop();

        desktopSR = new Gemini(
            targetLanguage,
            sourceLanguage,
            config.gemini_settings.gemini_api_key,
            false,
            config.language_settings.japanese_omit_questionmark,
            true
        );
        info("[DESKTOP CAPTURE] Using Gemini for recognition");

        setGeminiDesktopInterval(
            setInterval(() => {
                setGeminiDesktopStatus(desktopSR?.status() as GeminiState);

                setStatusTrigger(!statusTrigger);
            }, 100)
        );

        desktopSR.onResult(async (result: string[], isFinal: boolean) => {
            if (config.data_out.enable_desktop_data) {
                send_desktop_recognition(result[0], isFinal);

                if (isFinal) send_desktop_translation(result[1]);
            }

            if (isFinal) {
                console.log("[DESKTOP CAPTURE] Result: " + result);

                setDesktopResult(result[1]);
            }
        });

        desktopSR.start();
    };

    const restartSR = (cfg: Config) => {
        sr?.stop();
        if (geminiSRInterval != null) {
            clearInterval(geminiSRInterval);
            setGeminiSRInterval(null);
        }

        if (geminiDesktopInterval != null) {
            clearInterval(geminiDesktopInterval);
            setGeminiDesktopInterval(null);
        }

        info(`[SR] Initializing SR...`);

        if (!cfg.gemini_settings.microphone_capture) {
            sr = new WebSpeech(sourceLanguage, targetLanguage);
            info("[SR] Using WebSpeech for recognition");

            sr.onResult((result: string[], isFinal: boolean) => {
                setDetecting(!isFinal);
                setResult(result);
            });
        } else {
            setGeminiAsSR();
        }

        info("[SR] Starting recognition");
        sr?.start();
    };

    const restartDesktopSR = (cfg: Config) => {
        if (cfg.gemini_settings.desktop_capture) {
            info("[DESKTOP CAPTURE] Starting desktop capture...");

            enableDesktopCapture();
        } else desktopSR?.stop();
    };

    React.useEffect(() => {
        setGeminiErrorShown(geminiDesktopStatus.error || geminiSRStatus.error)
    }, [geminiDesktopStatus, geminiSRStatus])

    React.useEffect(() => {
        if (config.enable_overlay) send_notification_text(desktopResult, (config.source_language == "ja" || config.source_language == "ko" || config.source_language == "zh"));
    }, [desktopResult]);

    React.useEffect(() => {
        if (!languageUpdate) return;
        info(
            `[LANGUAGE] Changing language (${sourceLanguage} - ${targetLanguage}) - sr=${sr != null
            }`
        );

        if (sr) {
            sr?.stop();
            desktopSR?.stop();

            setTimeout(() => {
                restartSR(config);
                restartDesktopSR(config);
            }, 1000);
        }

        setLanguageUpdate(false);
    }, [languageUpdate]);

    React.useEffect(() => {
        if (vrcMuted && !startedSpeaking) {
            console.log("Skipping this");

            return;
        }

        setDetection(result[0]);
        setStartedSpeaking(detecting);

        if (
            (config.mode == 1 || config.vrchat_settings.send_typing_status_while_talking) && config.vrchat_settings.enable_chatbox) {
            invoke("send_typing", {
                address: config.vrchat_settings.osc_address,
                port: `${config.vrchat_settings.osc_port}`,
            });
        }

        if (config.data_out.enable_user_data) {
            send_user_recognition(result[0], !detecting);

            if (!detecting) send_user_translation(result[1]);
        }

        if (!detecting && result.length != 0 && result[1].length != 0) {
            detectionQueue = [...detectionQueue, result];

            info(
                `[QUEUE] Updating queue. Current queue length: ${detectionQueue.length}`
            );
        }
    }, [result, detecting]);

    React.useEffect(() => {
        info(`[SR] SR status=${srStatus}`);

        if (sr == null) {
            warn("[SR] SR is currently null, so ignoring the changes");

            return;
        }

        if (srStatus) {
            info("[SR] Starting SR...");
            sr.start();
            desktopSR?.start();
        } else {
            info("[SR] Stopping SR...");
            sr.stop();
            desktopSR?.stop();
        }
    }, [srStatus]);

    React.useEffect(() => {
        (async () => {
            if (detectionQueue.length == 0 || lock) return;

            const current = detectionQueue[0];
            detectionQueue = detectionQueue.slice(1);

            lock = true;

            info(
                `[QUEUE] Processing the queue. Current queue length: ${detectionQueue.length}`
            );

            const current_detection = current[0];
            const current_translation = current[1];

            if (config.mode == 0) setTranslated(current_translation);

            // Add to message history if enabled
            if (config.message_history.enabled) {
                const newHistoryItem: MessageHistoryItem = {
                    source: current_detection,
                    translation: current_translation,
                    timestamp: Date.now(),
                };

                // Add the new item and limit to max items
                const updatedItems = [
                    newHistoryItem,
                    ...config.message_history.items,
                ].slice(0, config.message_history.max_items);

                setConfig({
                    ...config,
                    message_history: {
                        ...config.message_history,
                        items: updatedItems,
                    },
                });
            }

            if (config.vrchat_settings.enable_chatbox) {
                info("[TRANSLATION] Sending the message to chatbox...");
                invoke("send_message", {
                    address: config.vrchat_settings.osc_address,
                    port: `${config.vrchat_settings.osc_port}`,
                    msg: config.mode == 1 ? current_detection : config.vrchat_settings.only_translation
                        ? current_translation
                        : config.vrchat_settings.translation_first
                            ? `${current_translation} (${current_detection})`
                            : `${current_detection} (${current_translation})`,
                });
            }

            await new Promise((r) =>
                setTimeout(
                    r,
                    calculateMinWaitTime(
                        current_translation,
                        config.vrchat_settings.chatbox_update_speed
                    )
                )
            );

            lock = false;
        })();

        setTimeout(() => {
            setTriggerUpdate(!triggerUpdate);
        }, 100);
    }, [triggerUpdate]);

    React.useEffect(() => {
        listen<boolean>("vrchat-mute", (event) => {
            info(`[OSC] Received mute status ${event.payload}`);
            setVRCMuted(event.payload);
        });

        listen<boolean>("disable-kikitan-mic", (event) => {
            info(`[OSC] Received disable mic ${event.payload}`);

            setSRStatus(!event.payload);
        });

        listen<boolean>("disable-kikitan-desktop", (event) => {
            info(`[OSC] Received disable desktop capture ${event.payload}`);

            if (event.payload) desktopSR?.stop();
            else desktopSR?.start();
        });

        listen<boolean>("disable-kikitan-chatbox", (event) => {
            info(`[OSC] Received disable chatbox ${event.payload}`);

            setConfig({
                ...config,
                vrchat_settings: {
                    ...config.vrchat_settings,
                    enable_chatbox: !event.payload,
                },
            });
        });

        listen<boolean>("disable-kikitan-overlay", (event) => {
            info(`[OSC] Received disable overlay ${event.payload}`);

            setConfig({
                ...config,
                enable_overlay: !event.payload,
            });
        });

        if (sr == null) {
            setInterval(() => {
                navigator.mediaDevices
                    .enumerateDevices()
                    .then(function (devices) {
                        let def = devices.filter(
                            (device) => device.kind == "audioinput"
                        )[0].label;
                        def = def.split("(")[1].split(")")[0];

                        setDefaultMicrophone(def);
                    })
                    .catch(function (err) {
                        error(
                            `[MEDIA] Error while trying to pull the media devices: ${err.name + " " + err.message
                            }`
                        );
                    });
            }, 1000);

            restartSR(config);
            restartDesktopSR(config);
        }
    }, []);

    React.useEffect(() => {
        if (
            settingsVisible == false &&
            defaultMicrophone != localization.waiting_for_mic_access[lang] &&
            srStatus
        ) {
            restartSR(config);
            restartDesktopSR(config);
            setGeminiErrorShown(false);
        }
    }, [settingsVisible]);

    React.useEffect(() => {
        if (defaultMicrophone == localization.waiting_for_mic_access[lang])
            return;
        info("[MEDIA] Updating current microphone to " + defaultMicrophone);

        if (lastDefaultMicrophone == "") {
            setLastDefaultMicrophone(defaultMicrophone);

            return;
        }

        if (lastDefaultMicrophone == defaultMicrophone) return;

        window.location.reload();
    }, [defaultMicrophone]);

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };

    return (
        <>
            <div id="main" className="relative transition-all">
                {/* Message History Modal */}
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
                        className={`flex flex-col w-10/12 h-96 outline outline-1 ${config.light_mode
                                ? "outline-white"
                                : "outline-slate-900"
                            } rounded ${config.light_mode ? "bg-white" : "bg-slate-950"
                            } p-4 overflow-hidden`}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2
                                className={`text-xl font-bold ${config.light_mode
                                        ? "text-black"
                                        : "text-white"
                                    }`}
                            >
                                {localization.message_history[lang]}
                            </h2>
                            <IconButton
                                onClick={() => setShowMessageHistory(false)}
                                sx={{
                                    color: config.light_mode
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
                            {config.message_history.items.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <span
                                        className={`text-sm italic ${config.light_mode
                                                ? "text-gray-500"
                                                : "text-gray-400"
                                            }`}
                                    >
                                        {localization.no_history[lang]}
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {config.message_history.items.map(
                                        (item, index) => (
                                            <div
                                                key={index}
                                                className={`p-3 rounded-md ${config.light_mode
                                                        ? "bg-gray-100"
                                                        : "bg-slate-900"
                                                    }`}
                                            >
                                                <div
                                                    className={`text-xs mb-1 ${config.light_mode
                                                            ? "text-gray-500"
                                                            : "text-gray-400"
                                                        }`}
                                                >
                                                    {formatTimestamp(
                                                        item.timestamp
                                                    )}
                                                </div>
                                                <div
                                                    className={`font-medium ${config.light_mode
                                                            ? "text-black"
                                                            : "text-white"
                                                        }`}
                                                >
                                                    {item.source}
                                                </div>
                                                <div
                                                    className={`mt-1 ${config.light_mode
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
                        className={`flex flex-col justify-center w-7/12 h-2/6 outline outline-1 ${config.light_mode
                                ? "outline-white"
                                : "outline-slate-900"
                            } rounded ${config.light_mode ? "bg-white" : "bg-slate-950"
                            }`}
                    >
                        <div className="flex flex-row justify-center gap-2">
                            <TextField
                                slotProps={{
                                    inputLabel: {
                                        style: {
                                            color: config.light_mode
                                                ? "black"
                                                : "#94A3B8",
                                        },
                                    },
                                    htmlInput: {
                                        style: {
                                            color: config.light_mode
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
                                        sr?.manual_trigger(textInputValue);

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
                                    sr?.manual_trigger(textInputValue);
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
                                    ? "italic " + config.light_mode
                                        ? "text-slate-400 outline-slate-800"
                                        : "text-slate-200 outline-slate-400"
                                    : config.light_mode
                                        ? "text-black"
                                        : "text-slate-200"
                                } ${srStatus ? "" : "bg-gray-400"}`}
                        >
                            <p className="align-middle">{detection}</p>
                        </div>
                        <div className="flex">
                            <Select
                                sx={{
                                    color: config.light_mode
                                        ? "black"
                                        : "white",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: config.light_mode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline":
                                    {
                                        borderColor: config.light_mode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "& .MuiSvgIcon-root": {
                                        color: config.light_mode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "&.Mui-disabled": {
                                        color: config.light_mode
                                            ? "black"
                                            : "white",
                                        "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: config.light_mode
                                                ? "black"
                                                : "#94A3B8",
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline":
                                        {
                                            borderColor: config.light_mode
                                                ? "black"
                                                : "#94A3B8",
                                        },
                                        "& .MuiSvgIcon-root": {
                                            color: config.light_mode
                                                ? "black"
                                                : "#94A3B8",
                                        },
                                    },
                                }}
                                MenuProps={{
                                    sx: {
                                        "& .MuiPaper-root": {
                                            backgroundColor: config.light_mode
                                                ? "#94A3B8"
                                                : "#020617",
                                        },
                                    },
                                }}
                                className="mt-4 ml-auto h-14"
                                value={sourceLanguage}
                                onChange={(e) => {
                                    setSourceLanguage(e.target.value);
                                    setLanguageUpdate(true);

                                    setConfig({
                                        ...config,
                                        source_language: e.target.value,
                                    });
                                }}
                            >
                                {langSource.map((element) => {
                                    return (
                                        <MenuItem
                                            sx={{
                                                color: config.light_mode
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
                                <Button
                                    onClick={() => {
                                        const new_t = sourceLanguage.includes(
                                            "en-"
                                        )
                                            ? "en"
                                            : sourceLanguage.includes("es-")
                                                ? "es"
                                                : sourceLanguage;
                                        const new_s =
                                            targetLanguage == "en"
                                                ? "en-US"
                                                : targetLanguage == "es"
                                                    ? "es-ES"
                                                    : targetLanguage;

                                        setTargetLanguage(new_t);
                                        setSourceLanguage(new_s);
                                        setLanguageUpdate(true);

                                        setConfig({
                                            ...config,
                                            source_language: new_s,
                                            target_language: new_t,
                                        });
                                    }}
                                >
                                    <SwapHorizIcon />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div
                            className={`w-96 h-48 outline outline-1 transition-all rounded-md ${config.light_mode
                                    ? "text-black outline-slate-800"
                                    : "text-slate-200 outline-slate-400"
                                } font-bold text-center ${srStatus ? "" : "bg-gray-400"
                                }`}
                        >
                            <p
                                className={`transition-all duration-300 align-middle`}
                            >
                                {translated}
                            </p>
                        </div>
                        <div>
                            <Select
                                sx={{
                                    color: config.light_mode
                                        ? "black"
                                        : "white",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: config.light_mode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline":
                                    {
                                        borderColor: config.light_mode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                    "& .MuiSvgIcon-root": {
                                        color: config.light_mode
                                            ? "black"
                                            : "#94A3B8",
                                    },
                                }}
                                MenuProps={{
                                    sx: {
                                        "& .MuiPaper-root": {
                                            backgroundColor: config.light_mode
                                                ? "#94A3B8"
                                                : "#020617",
                                        },
                                    },
                                }}
                                className="mt-4"
                                value={targetLanguage}
                                onChange={(e) => {
                                    setTargetLanguage(e.target.value);
                                    setLanguageUpdate(true);

                                    setConfig({
                                        ...config,
                                        target_language: e.target.value,
                                    });
                                }}
                            >
                                {langTo.map((element) => {
                                    return (
                                        <MenuItem
                                            sx={{
                                                color: config.light_mode
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
                    color={srStatus ? "error" : "success"}
                    onClick={() => {
                        invoke("send_disable_mic", {
                            data: !srStatus,
                            address: config.vrchat_settings.osc_address,
                            port: `${config.vrchat_settings.osc_port}`,
                        });

                        setSRStatus(!srStatus);
                    }}
                >
                    <p>
                        {!srStatus
                            ? localization.start[lang]
                            : localization.stop[lang]}
                    </p>{" "}
                    {srStatus ? (
                        <PauseIcon fontSize="small" />
                    ) : (
                        <PlayArrowIcon fontSize="small" />
                    )}
                </Button>
                {config.message_history.enabled && (
                    <Tooltip title={localization.message_history[lang]}>
                        <Button
                            variant="outlined"
                            size="medium"
                            onClick={() => setShowMessageHistory(true)}
                            disabled={config.message_history.items.length === 0}
                        >
                            <HistoryIcon fontSize="small" />
                        </Button>
                    </Tooltip>
                )}
            </div>

            <div id="social-links" className="align-middle">
                <div className="flex justify-center">
                    <p
                        className={`text-sm mt-2 ${config.gemini_settings.microphone_capture
                                ? "text-slate-700"
                                : "text-slate-200"
                            }`}
                    >
                        {localization.legacy_capture[lang]}
                    </p>
                    <Switch
                        sx={{
                            "& .MuiSwitch-thumb": {
                                color: config.light_mode
                                    ? "#444444"
                                    : "#94A3B8",
                            },
                            "& .MuiSwitch-track": {
                                backgroundColor: config.light_mode
                                    ? "#000000"
                                    : "#94A3B8",
                            },
                        }}
                        checked={config.gemini_settings.microphone_capture}
                        onChange={(e) => {
                            const new_cfg = {
                                ...config,
                                gemini_settings: {
                                    ...config.gemini_settings,
                                    microphone_capture: e.target.checked,
                                },
                            };
                            setConfig(new_cfg);
                            restartSR(new_cfg);
                        }}
                    ></Switch>
                    <p
                        className={`text-sm mt-2 ${!config.gemini_settings.microphone_capture
                                ? "text-slate-700"
                                : "text-slate-200"
                            }`}
                    >
                        {localization.gemini_capture[lang]}
                    </p>
                </div>
                <div className="flex justify-center">
                    <p
                        className={`text-sm mt-2 ${config.gemini_settings.desktop_capture
                                ? "text-slate-700"
                                : "text-slate-200"
                            }`}
                    >
                        {localization.disable_desktop_capture[lang]}
                    </p>
                    <Switch
                        sx={{
                            "& .MuiSwitch-thumb": {
                                color: config.light_mode
                                    ? "#444444"
                                    : "#94A3B8",
                            },
                            "& .MuiSwitch-track": {
                                backgroundColor: config.light_mode
                                    ? "#000000"
                                    : "#94A3B8",
                            },
                        }}
                        checked={config.gemini_settings.desktop_capture}
                        onChange={(e) => {
                            const new_cfg = {
                                ...config,
                                gemini_settings: {
                                    ...config.gemini_settings,
                                    desktop_capture: e.target.checked,
                                },
                            };
                            setConfig(new_cfg);
                            restartDesktopSR(new_cfg);
                        }}
                    ></Switch>
                    <p
                        className={`text-sm mt-2 ${!config.gemini_settings.desktop_capture
                                ? "text-slate-700"
                                : "text-slate-200"
                            }`}
                    >
                        {localization.enable_desktop_capture[lang]}
                    </p>
                </div>
                <div
                    id="gemini-status"
                    className="text-md flex justify-center gap-1"
                >
                    <p className="text-center">
                        <Circle
                            color={
                                geminiSRStatus?.connected
                                    ? "success"
                                    : geminiSRStatus?.error ||
                                        geminiSRStatus?.connection_established_time !=
                                        0
                                        ? "error"
                                        : geminiSRStatus?.connection_init_time
                                            ? "warning"
                                            : "inherit"
                            }
                            className="mr-2"
                        ></Circle>
                        {localization.gemini_status[lang]}
                        <Circle
                            color={
                                geminiDesktopStatus?.connected
                                    ? "success"
                                    : geminiDesktopStatus?.error ||
                                        geminiDesktopStatus?.connection_established_time !=
                                        0
                                        ? "error"
                                        : geminiDesktopStatus?.connection_init_time
                                            ? "warning"
                                            : "inherit"
                            }
                            className="ml-2"
                        ></Circle>
                    </p>
                </div>
                <div id="default-mic" className="justify-center flex mt-4">
                    <KeyboardVoiceIcon fontSize="small" />
                    <a
                        className=" text-blue-700"
                        href=""
                        onClick={(e) => {
                            e.preventDefault();

                            invoke("show_audio_settings");
                        }}
                    >
                        {defaultMicrophone}
                    </a>
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
                            className={config.light_mode ? "" : "invert"}
                            width={18}
                        />
                    </Button>
                </div>
            </div>
        </>
    );
}
