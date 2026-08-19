import express from "express";
import {
    WebcastEvent,
    ControlEvent,
    TikTokLiveConnection
} from "tiktok-live-connector";
import { WebSocketServer } from "ws";
import fs from "fs";
import path from "path";


/* ============================================================
   CONFIG
   ============================================================ */

const PORT = 3000;
const WS_PORT = 3001;

const CONFIG_FILE =
    path.join(process.cwd(), "dock-config.json");

const SOUND_CONFIG_FILE =
    path.join(process.cwd(), "sound-config.json");

const SOUNDS_DIR =
    path.join(process.cwd(), "sounds");

const CUSTOM_SOUNDS_DIR =
    path.join(SOUNDS_DIR, "custom");


/*
 * Approximate creator payout value per coin.
 *
 * TikTok's actual creator payout can vary, so this is
 * an estimate rather than an official fixed exchange rate.
 */
const COIN_USD_VALUE = 0.005;


/* ============================================================
   DIRECTORIES
   ============================================================ */

function ensureDirectories() {

    try {

        fs.mkdirSync(
            CUSTOM_SOUNDS_DIR,
            {
                recursive: true
            }
        );

    } catch (error) {

        console.error(
            "[SOUNDS] Could not create sound directory:",
            error
        );

    }

}

ensureDirectories();


/* ============================================================
   CONFIG STORAGE
   ============================================================ */

function loadConfig() {

    try {

        if (
            fs.existsSync(CONFIG_FILE)
        ) {

            const raw =
                fs.readFileSync(
                    CONFIG_FILE,
                    "utf8"
                );

            const config =
                JSON.parse(raw);

            if (
                typeof config.username === "string" &&
                config.username.trim()
            ) {

                return {
                    username:
                        config.username.trim()
                };

            }

        }

    } catch (error) {

        console.error(
            "[CONFIG] Could not load config:",
            error
        );

    }


    return {
        username: "kickrzzz"
    };

}


function saveConfig() {

    try {

        fs.writeFileSync(
            CONFIG_FILE,
            JSON.stringify(
                {
                    username: USERNAME
                },
                null,
                4
            ),
            "utf8"
        );

    } catch (error) {

        console.error(
            "[CONFIG] Could not save config:",
            error
        );

    }

}


let USERNAME =
    loadConfig().username;


/* ============================================================
   SOUND CONFIG
   ============================================================ */

const DEFAULT_SOUND_CONFIG = {

    globalEnabled: false,

    follow: {
        enabled: false,
        volume: 1,
        file: null
    },

    gift: {
        enabled: false,
        volume: 1,
        file: null
    },

    likes500: {
        enabled: false,
        volume: 1,
        file: null
    }

};


function loadSoundConfig() {

    try {

        if (
            fs.existsSync(
                SOUND_CONFIG_FILE
            )
        ) {

            const raw =
                fs.readFileSync(
                    SOUND_CONFIG_FILE,
                    "utf8"
                );

            const saved =
                JSON.parse(raw);


            return {

                globalEnabled:
                    saved.globalEnabled === true,

                follow: {

                    enabled:
                        saved.follow?.enabled === true,

                    volume:
                        clampVolume(
                            saved.follow?.volume
                        ),

                    file:
                        normalizeSoundPath(
                            saved.follow?.file
                        )

                },

                gift: {

                    enabled:
                        saved.gift?.enabled === true,

                    volume:
                        clampVolume(
                            saved.gift?.volume
                        ),

                    file:
                        normalizeSoundPath(
                            saved.gift?.file
                        )

                },

                likes500: {

                    enabled:
                        saved.likes500?.enabled === true,

                    volume:
                        clampVolume(
                            saved.likes500?.volume
                        ),

                    file:
                        normalizeSoundPath(
                            saved.likes500?.file
                        )

                }

            };

        }

    } catch (error) {

        console.error(
            "[SOUNDS] Could not load sound config:",
            error
        );

    }


    return structuredClone(
        DEFAULT_SOUND_CONFIG
    );

}


function saveSoundConfig() {

    try {

        fs.writeFileSync(
            SOUND_CONFIG_FILE,
            JSON.stringify(
                soundConfig,
                null,
                4
            ),
            "utf8"
        );

    } catch (error) {

        console.error(
            "[SOUNDS] Could not save sound config:",
            error
        );

    }

}


function clampVolume(value) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return 1;

    }


    return Math.min(
        1,
        Math.max(
            0,
            number
        )
    );

}


function normalizeSoundPath(value) {

    if (
        typeof value !== "string" ||
        !value.trim()
    ) {

        return null;

    }


    const normalized =
        value.trim();


    /*
     * Only allow our own sound directory.
     * This prevents arbitrary filesystem paths
     * from being stored in the configuration.
     */

    if (
        !normalized.startsWith(
            "/sounds/"
        )
    ) {

        return null;

    }


    if (
        normalized.includes("..")
    ) {

        return null;

    }


    return normalized;

}


let soundConfig =
    loadSoundConfig();


/* ============================================================
   EXPRESS
   ============================================================ */

const app =
    express();


app.use(
    express.json({
        limit: "25mb"
    })
);


app.use(
    express.static("public")
);


app.use(
    "/sounds",
    express.static(
        SOUNDS_DIR
    )
);


/* ============================================================
   SOUND API
   ============================================================ */

app.get(
    "/api/sound-settings",
    (req, res) => {

        res.json(
            soundConfig
        );

    }
);


app.post(
    "/api/sound-settings",
    (req, res) => {

        try {

            const incoming =
                req.body ?? {};


            soundConfig = {

                globalEnabled:
                    incoming.globalEnabled === true,

                follow: {

                    enabled:
                        incoming.follow?.enabled === true,

                    volume:
                        clampVolume(
                            incoming.follow?.volume
                        ),

                    file:
                        normalizeSoundPath(
                            incoming.follow?.file
                        )

                },

                gift: {

                    enabled:
                        incoming.gift?.enabled === true,

                    volume:
                        clampVolume(
                            incoming.gift?.volume
                        ),

                    file:
                        normalizeSoundPath(
                            incoming.gift?.file
                        )

                },

                likes500: {

                    enabled:
                        incoming.likes500?.enabled === true,

                    volume:
                        clampVolume(
                            incoming.likes500?.volume
                        ),

                    file:
                        normalizeSoundPath(
                            incoming.likes500?.file
                        )

                }

            };


            saveSoundConfig();


            res.json({
                success: true,
                settings: soundConfig
            });

        } catch (error) {

            console.error(
                "[SOUNDS] Could not save settings:",
                error
            );


            res.status(500).json({
                success: false,
                error: "Could not save sound settings."
            });

        }

    }
);


/* ============================================================
   SOUND UPLOAD
   ============================================================ */

app.post(
    "/api/upload-sound",
    (req, res) => {

        try {

            const {
                filename,
                data
            } = req.body ?? {};


            if (
                typeof filename !== "string" ||
                typeof data !== "string"
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Invalid upload."
                });

            }


            const extension =
                path.extname(
                    filename
                ).toLowerCase();


            const allowedExtensions =
                [
                    ".mp3",
                    ".wav",
                    ".ogg",
                    ".m4a",
                    ".aac"
                ];


            if (
                !allowedExtensions.includes(
                    extension
                )
            ) {

                return res.status(400).json({
                    success: false,
                    error:
                        "Unsupported audio format."
                });

            }


            /*
             * Sanitize the filename.
             */

            const baseName =
                path.basename(
                    filename,
                    extension
                )
                .replace(
                    /[^a-zA-Z0-9_-]/g,
                    "_"
                )
                .slice(
                    0,
                    80
                );


            if (
                !baseName
            ) {

                return res.status(400).json({
                    success: false,
                    error:
                        "Invalid filename."
                });

            }


            const finalFilename =
                `${Date.now()}-${baseName}${extension}`;


            const filePath =
                path.join(
                    CUSTOM_SOUNDS_DIR,
                    finalFilename
                );


            const buffer =
                Buffer.from(
                    data,
                    "base64"
                );


            /*
             * 15 MB maximum audio file.
             */

            if (
                buffer.length >
                15 * 1024 * 1024
            ) {

                return res.status(400).json({
                    success: false,
                    error:
                        "Audio file is too large. Maximum size is 15 MB."
                });

            }


            fs.writeFileSync(
                filePath,
                buffer
            );


            const publicPath =
                `/sounds/custom/${finalFilename}`;


            console.log(
                `[SOUNDS] Uploaded: ${finalFilename}`
            );


            res.json({

                success: true,

                file:
                    publicPath,

                filename:
                    finalFilename

            });

        } catch (error) {

            console.error(
                "[SOUNDS] Upload failed:",
                error
            );


            res.status(500).json({
                success: false,
                error:
                    "Could not upload audio file."
            });

        }

    }
);


/* ============================================================
   START HTTP SERVER
   ============================================================ */

app.listen(
    PORT,
    () => {

        console.log(
            `[DOCK] http://localhost:${PORT}`
        );

        console.log(
            `[DOCK] Alerts: http://localhost:${PORT}/alerts.html`
        );

    }
);


/* ============================================================
   WEBSOCKET SERVER
   ============================================================ */

const wss =
    new WebSocketServer({
        port: WS_PORT
    });


const clients =
    new Set();


/* ============================================================
   CONNECTION STATE
   ============================================================ */

let connection = null;

let reconnectTimer = null;

let followerRefreshTimer = null;

let manualDisconnect = false;

let connecting = false;


/* ============================================================
   LIVE STATE
   ============================================================ */

const liveState = {

    viewers: 0,

    likes: 0,

    totalFollowers: null,

    newFollowers: 0,

    gifts: 0,

    coins: 0,

    estimatedUsd: 0,

    hasAuthoritativeViewerCount: false

};


/* ============================================================
   BROADCAST
   ============================================================ */

function broadcast(data) {

    const message =
        JSON.stringify(data);


    for (
        const client of clients
    ) {

        if (
            client.readyState === 1
        ) {

            try {

                client.send(message);

            } catch {}

        }

    }

}


function broadcastStats() {

    broadcast({

        type: "stats",

        ...liveState

    });

}


function broadcastStatus(
    overrides = {}
) {

    broadcast({

        type: "status",

        username: USERNAME,

        connected:
            connection?.isConnected === true,

        connecting,

        ...overrides

    });

}


/* ============================================================
   RESET LIVE STATE
   ============================================================ */

function resetLiveState() {

    liveState.viewers = 0;

    liveState.likes = 0;

    liveState.totalFollowers = null;

    liveState.newFollowers = 0;

    liveState.gifts = 0;

    liveState.coins = 0;

    liveState.estimatedUsd = 0;

    liveState.hasAuthoritativeViewerCount = false;

}


/* ============================================================
   WEBSOCKET
   ============================================================ */

wss.on(
    "connection",
    ws => {

        clients.add(ws);


        ws.send(
            JSON.stringify({

                type: "status",

                username: USERNAME,

                connected:
                    connection?.isConnected === true,

                connecting

            })
        );


        ws.send(
            JSON.stringify({

                type: "stats",

                ...liveState

            })
        );


        ws.on(
            "message",
            async raw => {

                try {

                    const data =
                        JSON.parse(
                            raw.toString()
                        );


                    if (
                        data.type === "setUsername"
                    ) {

                        const requestedUsername =
                            String(
                                data.username ?? ""
                            )
                            .trim()
                            .replace(/^@/, "");


                        if (
                            !requestedUsername
                        ) {

                            ws.send(
                                JSON.stringify({

                                    type: "error",

                                    message:
                                        "Please enter a TikTok username."

                                })
                            );

                            return;

                        }


                        if (
                            requestedUsername === USERNAME &&
                            connection?.isConnected
                        ) {

                            ws.send(
                                JSON.stringify({

                                    type: "usernameSaved",

                                    username:
                                        USERNAME

                                })
                            );

                            return;

                        }


                        console.log(
                            `[DOCK] Changing monitored username: @${USERNAME} -> @${requestedUsername}`
                        );


                        USERNAME =
                            requestedUsername;


                        saveConfig();


                        await reconnectWithNewUsername();


                        return;

                    }


                    if (
                        data.type === "reconnect"
                    ) {

                        await reconnectWithNewUsername();

                        return;

                    }

                } catch (error) {

                    console.error(
                        "[WS] Message error:",
                        error
                    );

                }

            }
        );


        ws.on(
            "close",
            () => {

                clients.delete(ws);

            }
        );

    }
);


/* ============================================================
   GENERIC RECURSIVE VALUE FINDER
   ============================================================ */

function findNumericValue(
    object,
    keys
) {

    if (
        object === null ||
        object === undefined ||
        typeof object !== "object"
    ) {

        return null;

    }


    for (
        const key of keys
    ) {

        const value =
            object[key];


        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            const number =
                Number(value);


            if (
                Number.isFinite(number) &&
                number >= 0
            ) {

                return number;

            }

        }

    }


    for (
        const value of Object.values(object)
    ) {

        if (
            value &&
            typeof value === "object"
        ) {

            const result =
                findNumericValue(
                    value,
                    keys
                );


            if (
                result !== null
            ) {

                return result;

            }

        }

    }


    return null;

}


/* ============================================================
   FOLLOWER COUNT
   ============================================================ */

function findFollowerCount(
    object
) {

    return findNumericValue(
        object,
        [
            "followerCount",
            "followerCountStr",
            "follower_count",
            "follower_count_str"
        ]
    );

}


function updateFollowerCount(
    roomInfo
) {

    const count =
        findFollowerCount(
            roomInfo
        );


    if (
        count === null
    ) {

        return;

    }


    liveState.totalFollowers =
        count;


    broadcastStats();

}


/* ============================================================
   LIKE COUNT
   ============================================================ */

function findLikeCount(
    object
) {

    return findNumericValue(
        object,
        [
            "totalLikeCount",
            "totalLikeCountStr",
            "totalLikes",
            "totalLikesCount",
            "total_like_count"
        ]
    );

}


function updateLikeCount(
    object
) {

    const count =
        findLikeCount(
            object
        );


    if (
        count === null
    ) {

        return false;

    }


    if (
        count >= liveState.likes
    ) {

        liveState.likes =
            count;


        broadcast({

            type: "likes",

            total:
                liveState.likes

        });


        broadcastStats();


        return true;

    }


    return false;

}


/* ============================================================
   ROOM INFO REFRESH
   ============================================================ */

async function refreshRoomStats() {

    if (
        !connection ||
        !connection.isConnected
    ) {

        return;

    }


    try {

        const roomInfo =
            await connection.getRoomInfo();


        updateFollowerCount(
            roomInfo
        );


        updateLikeCount(
            roomInfo
        );

    } catch {}

}


function startRoomStatsRefresh() {

    stopRoomStatsRefresh();


    followerRefreshTimer =
        setInterval(
            refreshRoomStats,
            3000
        );

}


function stopRoomStatsRefresh() {

    if (
        followerRefreshTimer
    ) {

        clearInterval(
            followerRefreshTimer
        );

        followerRefreshTimer = null;

    }

}


/* ============================================================
   CREATE TIKTOK CONNECTION
   ============================================================ */

function createConnection() {

    connection =
        new TikTokLiveConnection(
            USERNAME,
            {

                enableExtendedGiftInfo: false,

                fetchRoomInfoOnConnect: true,

                processInitialData: true

            }
        );


    /* ========================================================
       CONNECTED
       ======================================================== */

    connection.on(
        ControlEvent.CONNECTED,
        state => {

            connecting = false;


            console.log("");

            console.log(
                "================================="
            );

            console.log(
                `[TIKTOK] Connected to @${USERNAME}`
            );

            console.log(
                `[TIKTOK] Room ID: ${state.roomId}`
            );

            console.log(
                "================================="
            );

            console.log("");


            broadcastStatus({

                connected: true,

                connecting: false,

                roomId:
                    state.roomId

            });


            if (
                state.roomInfo
            ) {

                updateFollowerCount(
                    state.roomInfo
                );

                updateLikeCount(
                    state.roomInfo
                );

            }


            startRoomStatsRefresh();

        }
    );


    /* ========================================================
       DISCONNECTED
       ======================================================== */

    connection.on(
        ControlEvent.DISCONNECTED,
        ({ code, reason }) => {

            stopRoomStatsRefresh();

            connecting = false;


            console.log(
                `[TIKTOK] Disconnected (${code})`
            );


            if (
                reason
            ) {

                console.log(
                    `[TIKTOK] Reason: ${reason}`
                );

            }


            broadcastStatus({

                connected: false,

                connecting: false,

                reason:
                    reason ??
                    "Connection lost"

            });


            if (
                !manualDisconnect
            ) {

                scheduleReconnect();

            }

        }
    );


    /* ========================================================
       ERRORS
       ======================================================== */

    connection.on(
        ControlEvent.ERROR,
        error => {

            console.error(
                "[TIKTOK] Error:",
                error
            );


            broadcast({

                type: "debug",

                level: "error",

                message:
                    error?.message ??
                    String(error)

            });

        }
    );


    /* ========================================================
       CHAT
       ======================================================== */

    connection.on(
        WebcastEvent.CHAT,
        data => {

            const user =
                data.user?.uniqueId ??
                data.user?.nickname ??
                data.uniqueId ??
                "unknown";


            const nickname =
                data.user?.nickname ??
                user;


            const text =
                data.comment ??
                data.message ??
                data.text ??
                data.content ??
                data.msg ??
                "";


            broadcast({

                type: "chat",

                user,

                nickname,

                text

            });

        }
    );


    /* ========================================================
       GIFTS
       ======================================================== */

    connection.on(
        WebcastEvent.GIFT,
        data => {

            const user =
                data.user?.uniqueId ??
                data.user?.nickname ??
                data.uniqueId ??
                "unknown";


            const nickname =
                data.user?.nickname ??
                user;


            const giftName =
                data.giftName ??
                data.gift?.name ??
                `Gift #${data.giftId ?? "unknown"}`;


            const giftId =
                data.giftId ??
                data.gift?.id ??
                null;


            const repeatCount =
                Math.max(
                    1,
                    Number(
                        data.repeatCount ?? 1
                    )
                );


            const coinCount =
                Math.max(
                    0,
                    Number(
                        data.diamondCount ??
                        data.gift?.diamondCount ??
                        0
                    )
                );


            const giftType =
                data.giftType ??
                data.gift?.giftType ??
                null;


            const repeatEnd =
                data.repeatEnd === true ||
                data.repeatEnd === 1;


            const isStreakable =
                Number(giftType) === 1;


            const finalCount =
                isStreakable
                    ? repeatEnd
                        ? repeatCount
                        : 0
                    : repeatCount;


            const coinsForEvent =
                finalCount > 0
                    ? coinCount * finalCount
                    : 0;


            if (
                finalCount > 0
            ) {

                liveState.gifts +=
                    finalCount;


                liveState.coins +=
                    coinsForEvent;


                liveState.estimatedUsd =
                    liveState.coins *
                    COIN_USD_VALUE;

            }


            broadcast({

                type: "gift",

                user,

                nickname,

                giftName,

                giftId,

                repeatCount,

                diamondCount:
                    coinCount,

                coinCount,

                giftType,

                repeatEnd,

                isStreakable,

                countedAmount:
                    finalCount,

                countedDiamonds:
                    coinsForEvent,

                countedCoins:
                    coinsForEvent

            });


            if (
                finalCount > 0
            ) {

                broadcastStats();

            }

        }
    );


    /* ========================================================
       LIKES
       ======================================================== */

    connection.on(
        WebcastEvent.LIKE,
        data => {

            const total =
                findLikeCount(
                    data
                );


            if (
                total !== null &&
                total >= liveState.likes
            ) {

                liveState.likes =
                    total;

            } else {

                const batch =
                    Number(
                        data.likeCount ??
                        data.count ??
                        0
                    );


                if (
                    Number.isFinite(batch) &&
                    batch > 0
                ) {

                    liveState.likes +=
                        batch;

                } else {

                    return;

                }

            }


            broadcast({

                type: "likes",

                total:
                    liveState.likes

            });


            broadcastStats();

        }
    );


    /* ========================================================
       VIEWERS
       ======================================================== */

    connection.on(
        WebcastEvent.ROOM_USER,
        data => {

            const viewers =
                Number(
                    data.viewerCount
                );


            if (
                !Number.isFinite(viewers) ||
                viewers < 0
            ) {

                return;

            }


            liveState.viewers =
                viewers;


            liveState.hasAuthoritativeViewerCount =
                true;


            broadcast({

                type: "viewers",

                total:
                    viewers

            });


            broadcastStats();

        }
    );


    /* ========================================================
       JOIN
       ======================================================== */

    connection.on(
        WebcastEvent.MEMBER,
        data => {

            const user =
                data.user?.uniqueId ??
                data.user?.nickname ??
                data.uniqueId ??
                "unknown";


            const nickname =
                data.user?.nickname ??
                user;


            const memberCount =
                Number(
                    data.memberCount
                );


            if (
                !liveState.hasAuthoritativeViewerCount &&
                Number.isFinite(memberCount) &&
                memberCount >= 0
            ) {

                liveState.viewers =
                    memberCount;


                broadcast({

                    type: "viewers",

                    total:
                        memberCount

                });


                broadcastStats();

            }


            broadcast({

                type: "join",

                user,

                nickname

            });

        }
    );


    /* ========================================================
       FOLLOW
       ======================================================== */

    connection.on(
        WebcastEvent.FOLLOW,
        data => {

            const user =
                data.user?.uniqueId ??
                data.user?.nickname ??
                data.uniqueId ??
                "unknown";


            const nickname =
                data.user?.nickname ??
                user;


            liveState.newFollowers++;


            if (
                liveState.totalFollowers !== null &&
                Number.isFinite(
                    liveState.totalFollowers
                )
            ) {

                liveState.totalFollowers++;

            }


            broadcast({

                type: "follow",

                user,

                nickname

            });


            broadcastStats();

        }
    );


    /* ========================================================
       FAN CLUB
       ======================================================== */

    connection.on(
        WebcastEvent.SUPER_FAN,
        data => {

            const user =
                data.user?.uniqueId ??
                data.user?.nickname ??
                data.uniqueId ??
                "unknown";


            const nickname =
                data.user?.nickname ??
                user;


            broadcast({

                type: "fanclub",

                user,

                nickname

            });

        }
    );


    if (
        WebcastEvent.SUPER_FAN_JOIN
    ) {

        connection.on(
            WebcastEvent.SUPER_FAN_JOIN,
            data => {

                const user =
                    data.user?.uniqueId ??
                    data.user?.nickname ??
                    data.uniqueId ??
                    "unknown";


                const nickname =
                    data.user?.nickname ??
                    user;


                broadcast({

                    type: "fanclub",

                    user,

                    nickname

                });

            }
        );

    }

}


/* ============================================================
   CONNECT
   ============================================================ */

async function connectTikTok() {

    manualDisconnect = false;


    if (
        reconnectTimer
    ) {

        clearTimeout(
            reconnectTimer
        );

        reconnectTimer = null;

    }


    if (
        connection &&
        connection.isConnected
    ) {

        return;

    }


    connecting = true;


    console.log(
        `[TIKTOK] Connecting to @${USERNAME}...`
    );


    broadcastStatus({

        connected: false,

        connecting: true

    });


    try {

        createConnection();


        const state =
            await connection.connect();


        if (
            state?.roomInfo
        ) {

            updateFollowerCount(
                state.roomInfo
            );

            updateLikeCount(
                state.roomInfo
            );

        }


        connecting = false;


        broadcastStatus({

            connected: true,

            connecting: false

        });


        console.log(
            "[TIKTOK] Connection established."
        );


    } catch (error) {

        connecting = false;


        console.error(
            "[TIKTOK] Connection failed:",
            error
        );


        broadcastStatus({

            connected: false,

            connecting: false,

            error:
                error?.message ??
                "Could not connect"

        });


        if (
            !manualDisconnect
        ) {

            scheduleReconnect();

        }

    }

}


/* ============================================================
   RECONNECT
   ============================================================ */

function scheduleReconnect() {

    if (
        reconnectTimer
    ) {

        return;

    }


    const delay =
        5000;


    console.log(
        `[TIKTOK] Reconnecting in ${delay / 1000}s...`
    );


    reconnectTimer =
        setTimeout(
            async () => {

                reconnectTimer = null;


                if (
                    manualDisconnect
                ) {

                    return;

                }


                await connectTikTok();

            },
            delay
        );

}


/* ============================================================
   DISCONNECT
   ============================================================ */

async function disconnectTikTok() {

    manualDisconnect = true;

    connecting = false;


    stopRoomStatsRefresh();


    if (
        reconnectTimer
    ) {

        clearTimeout(
            reconnectTimer
        );

        reconnectTimer = null;

    }


    if (
        connection
    ) {

        try {

            await connection.disconnect();

        } catch {}


        connection = null;

    }


    broadcastStatus({

        connected: false,

        connecting: false

    });

}


/* ============================================================
   RECONNECT WITH NEW USERNAME
   ============================================================ */

async function reconnectWithNewUsername() {

    await disconnectTikTok();


    resetLiveState();


    broadcastStats();


    broadcastStatus({

        connected: false,

        connecting: true

    });


    const connectionPromise =
        connectTikTok();


    broadcast({

        type: "usernameSaved",

        username:
            USERNAME

    });


    await connectionPromise;

}


/* ============================================================
   STARTUP
   ============================================================ */

console.log("");

console.log(
    "================================="
);

console.log(
    "          TikTok Dock"
);

console.log(
    "================================="
);

console.log(
    `Username: @${USERNAME}`
);

console.log(
    `Stats Dock: http://localhost:${PORT}`
);

console.log(
    `Alerts Dock: http://localhost:${PORT}/alerts.html`
);

console.log(
    "Alert sounds: DISABLED BY DEFAULT"
);

console.log(
    "Coin tracking: ENABLED"
);

console.log(
    `Estimated coin USD: $${COIN_USD_VALUE}`
);

console.log(
    "================================="
);

console.log("");