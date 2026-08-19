import express from "express";
import {
    WebcastEvent,
    ControlEvent,
    TikTokLiveConnection
} from "tiktok-live-connector";
import { WebSocketServer } from "ws";

const PORT = 3000;
const WS_PORT = 3001;
const USERNAME = "username_here";

// Estimated creator value per diamond.
// This is an estimate, not a guaranteed TikTok payout rate.
const USD_PER_DIAMOND = 0.005;

const app = express();
app.use(express.static("public"));

app.listen(PORT, () => {
    console.log(`[DOCK] http://localhost:${PORT}`);
});

const wss = new WebSocketServer({
    port: WS_PORT
});

const clients = new Set();

let currentMode = "test";
let connection = null;
let reconnectTimer = null;
let manualDisconnect = false;

const liveState = {
    viewers: 0,
    likes: 0,
    totalFollowers: null,
    newFollowers: 0,

    // Total gift items received.
    gifts: 0,

    // Total diamonds received.
    diamonds: 0,

    // Estimated creator value in USD.
    estimatedUsd: 0,

    hasAuthoritativeViewerCount: false
};

function broadcast(data) {
    const message = JSON.stringify(data);

    for (const client of clients) {
        if (client.readyState === 1) {
            client.send(message);
        }
    }
}

function broadcastStats() {
    broadcast({
        type: "stats",
        ...liveState
    });
}

wss.on("connection", ws => {
    clients.add(ws);

    ws.send(JSON.stringify({
        type: "status",
        mode: currentMode,
        connected:
            currentMode === "stream" &&
            connection?.isConnected === true
    }));

    ws.send(JSON.stringify({
        type: "stats",
        ...liveState
    }));

    ws.on("message", async raw => {
        try {
            const data = JSON.parse(raw.toString());

            if (data.type === "setMode") {
                if (data.mode === "test") {
                    await enterTestMode();
                }

                if (data.mode === "stream") {
                    await enterStreamMode();
                }
            }

            if (
                data.type === "testEvent" &&
                currentMode === "test"
            ) {
                sendTestEvent();
            }
        } catch (error) {
            console.error("[WS] Message error:", error);
        }
    });

    ws.on("close", () => {
        clients.delete(ws);
    });
});

/* ============================================================
   TEST MODE
   ============================================================ */

const testState = {
    viewers: 127,
    likes: 4821,
    totalFollowers: 1247,
    newFollowers: 32,
    gifts: 0,
    diamonds: 0,
    estimatedUsd: 0
};

const fakeEvents = [
    {
        type: "chat",
        user: "viewer123",
        text: "hello bro"
    },
    {
        type: "chat",
        user: "pikachu_fan",
        text: "W stream 🔥"
    },
    {
        type: "gift",
        user: "gift_master",
        giftName: "Rose",
        repeatCount: 3,
        diamondCount: 1
    },
    {
        type: "gift",
        user: "legendary_viewer",
        giftName: "Galaxy",
        repeatCount: 1,
        diamondCount: 1000
    },
    {
        type: "follow",
        user: "newviewer"
    },
    {
        type: "join",
        user: "randomviewer"
    },
    {
        type: "fanclub",
        user: "pikachu_fan"
    }
];

function sendTestStats() {
    broadcast({
        type: "stats",
        viewers: testState.viewers,
        likes: testState.likes,
        totalFollowers: testState.totalFollowers,
        newFollowers: testState.newFollowers,
        gifts: testState.gifts,
        diamonds: testState.diamonds,
        estimatedUsd: testState.estimatedUsd
    });
}

function sendTestEvent() {
    const event =
        fakeEvents[
            Math.floor(
                Math.random() * fakeEvents.length
            )
        ];

    if (event.type === "gift") {

        const quantity =
            Number(event.repeatCount ?? 1);

        const diamonds =
            Number(event.diamondCount ?? 0) *
            quantity;

        testState.gifts += quantity;
        testState.diamonds += diamonds;
        testState.estimatedUsd +=
            diamonds * USD_PER_DIAMOND;

        broadcast({
            ...event,
            diamonds,
            estimatedUsd:
                diamonds * USD_PER_DIAMOND,
            countedAmount: quantity
        });
    }

    if (event.type === "chat") {
        broadcast(event);
    }

    if (event.type === "follow") {
        testState.newFollowers++;

        broadcast(event);
    }

    if (event.type === "join") {
        broadcast(event);
    }

    if (event.type === "fanclub") {
        broadcast(event);
    }

    sendTestStats();
}

setInterval(() => {
    if (currentMode !== "test") {
        return;
    }

    testState.viewers = Math.max(
        0,
        testState.viewers +
        (Math.random() > 0.5 ? 1 : -1)
    );

    testState.likes +=
        Math.floor(Math.random() * 8);

    sendTestStats();
    sendTestEvent();

}, 5000);

/* ============================================================
   TIKTOK CONNECTION
   ============================================================ */

function createConnection() {

    connection = new TikTokLiveConnection(
        USERNAME,
        {
            // IMPORTANT:
            // Extended gift info remains disabled.
            enableExtendedGiftInfo: false,

            fetchRoomInfoOnConnect: true,

            processInitialData: true
        }
    );

    /* --------------------------------------------------------
       CONNECTED
       -------------------------------------------------------- */

    connection.on(
        ControlEvent.CONNECTED,
        state => {

            console.log("");
            console.log("=================================");
            console.log(
                `[TIKTOK] Connected to @${USERNAME}`
            );
            console.log(
                `[TIKTOK] Room ID: ${state.roomId}`
            );
            console.log("=================================");
            console.log("");

            broadcast({
                type: "status",
                mode: "stream",
                connected: true,
                connecting: false,
                roomId: state.roomId
            });

            if (state.roomInfo) {
                updateFollowerCount(
                    state.roomInfo
                );
            }
        }
    );

    /* --------------------------------------------------------
       DISCONNECTED
       -------------------------------------------------------- */

    connection.on(
        ControlEvent.DISCONNECTED,
        ({ code, reason }) => {

            console.log(
                `[TIKTOK] Disconnected (${code})`
            );

            if (reason) {
                console.log(
                    `[TIKTOK] Reason: ${reason}`
                );
            }

            broadcast({
                type: "status",
                mode: "stream",
                connected: false,
                connecting: false,
                reason:
                    reason ?? "Connection lost"
            });

            if (
                !manualDisconnect &&
                currentMode === "stream"
            ) {
                scheduleReconnect();
            }
        }
    );

    /* --------------------------------------------------------
       ERRORS
       -------------------------------------------------------- */

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

    /* --------------------------------------------------------
       CHAT
       -------------------------------------------------------- */

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
                data.comment ?? "";

            console.log(
                `[CHAT] ${user}: ${text}`
            );

            broadcast({
                type: "chat",
                user,
                nickname,
                text
            });
        }
    );

    /* --------------------------------------------------------
       GIFTS
       -------------------------------------------------------- */

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

            /*
             * Gift name can be available directly
             * without extended gift information.
             */
            const giftName =
                data.giftName ??
                data.giftDetails?.giftName ??
                `Gift #${data.giftId ?? "unknown"}`;

            const giftId =
                data.giftId ??
                data.giftDetails?.giftId ??
                null;

            /*
             * IMPORTANT:
             *
             * diamondCount is part of the gift message.
             *
             * Try both locations because connector/protocol
             * versions can expose the field differently.
             */
            const diamondCount =
                Number(
                    data.diamondCount ??
                    data.giftDetails?.diamondCount ??
                    0
                );

            const repeatCount =
                Number(
                    data.repeatCount ?? 1
                );

            const giftType =
                data.giftType ??
                data.giftDetails?.giftType ??
                data.gift?.giftType ??
                null;

            const repeatEnd =
                data.repeatEnd === true ||
                data.repeatEnd === 1;

            const isStreakable =
                giftType === 1;

            /*
             * Do NOT count intermediate streak events.
             *
             * The final event contains the complete
             * repeatCount and repeatEnd=true.
             */
            const finalCount =
                isStreakable
                    ? repeatEnd
                        ? repeatCount
                        : 0
                    : repeatCount;

            const totalDiamonds =
                finalCount > 0
                    ? diamondCount * finalCount
                    : 0;

            const estimatedUsd =
                totalDiamonds *
                USD_PER_DIAMOND;

            if (finalCount > 0) {

                liveState.gifts +=
                    finalCount;

                liveState.diamonds +=
                    totalDiamonds;

                liveState.estimatedUsd +=
                    estimatedUsd;
            }

            console.log(
                `[GIFT] ${user} → ` +
                `${giftName} ×${repeatCount} | ` +
                `${diamondCount} 💎 each | ` +
                `${totalDiamonds} 💎 total | ` +
                `$${estimatedUsd.toFixed(2)} est.`
            );

            broadcast({
                type: "gift",

                user,
                nickname,

                giftName,
                giftId,

                repeatCount,

                diamondCount,
                diamonds: totalDiamonds,

                estimatedUsd,

                giftType,
                repeatEnd,
                isStreakable,

                countedAmount: finalCount
            });

            if (finalCount > 0) {
                broadcastStats();
            }
        }
    );

    /* --------------------------------------------------------
       LIKES
       -------------------------------------------------------- */

    connection.on(
        WebcastEvent.LIKE,
        data => {

            const total =
                Number(
                    data.totalLikeCount ??
                    data.totalLikeCountStr ??
                    liveState.likes
                );

            liveState.likes = total;

            console.log(
                `[LIKE] Total likes: ${total}`
            );

            broadcast({
                type: "likes",
                total
            });

            broadcastStats();
        }
    );

    /* --------------------------------------------------------
       VIEWERS
       -------------------------------------------------------- */

    connection.on(
        WebcastEvent.ROOM_USER,
        data => {

            const viewers =
                Number(data.viewerCount);

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

            console.log(
                `[VIEWERS] Authoritative: ${viewers}`
            );

            broadcast({
                type: "viewers",
                total: viewers
            });

            broadcastStats();
        }
    );

    /* --------------------------------------------------------
       JOIN
       -------------------------------------------------------- */

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

            console.log(
                `[JOIN] ${user}`
            );

            const memberCount =
                Number(data.memberCount);

            /*
             * MEMBER is only a fallback.
             * ROOM_USER remains authoritative.
             */
            if (
                !liveState.hasAuthoritativeViewerCount &&
                Number.isFinite(memberCount) &&
                memberCount >= 0
            ) {

                liveState.viewers =
                    memberCount;

                console.log(
                    `[VIEWERS] MEMBER fallback: ${memberCount}`
                );

                broadcast({
                    type: "viewers",
                    total: memberCount
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

    /* --------------------------------------------------------
       FOLLOW
       -------------------------------------------------------- */

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

            console.log(
                `[FOLLOW] ${user}`
            );

            broadcast({
                type: "follow",
                user,
                nickname
            });

            broadcastStats();
        }
    );

    /* --------------------------------------------------------
       FAN CLUB
       -------------------------------------------------------- */

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

            console.log(
                `[FAN CLUB] ${user}`
            );

            broadcast({
                type: "fanclub",
                user,
                nickname
            });
        }
    );

    if (WebcastEvent.SUPER_FAN_JOIN) {

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

                console.log(
                    `[FAN CLUB JOIN] ${user}`
                );

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
   FOLLOWER COUNT
   ============================================================ */

function updateFollowerCount(roomInfo) {

    const candidates = [
        roomInfo?.owner?.followInfo?.followerCount,
        roomInfo?.owner?.followInfo?.followerCountStr,
        roomInfo?.owner?.follow_info?.follower_count,
        roomInfo?.followInfo?.followerCount,
        roomInfo?.followInfo?.followerCountStr
    ];

    const value =
        candidates.find(
            value =>
                value !== undefined &&
                value !== null
        );

    if (value !== undefined) {

        liveState.totalFollowers =
            Number(value);

        console.log(
            `[FOLLOWERS] Channel total: ` +
            `${liveState.totalFollowers}`
        );

        broadcastStats();
    }
}

/* ============================================================
   CONNECT
   ============================================================ */

async function connectTikTok() {

    manualDisconnect = false;

    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    if (
        connection &&
        connection.isConnected
    ) {
        return;
    }

    console.log(
        `[TIKTOK] Connecting to @${USERNAME}...`
    );

    broadcast({
        type: "status",
        mode: "stream",
        connected: false,
        connecting: true
    });

    try {

        createConnection();

        const state =
            await connection.connect();

        if (state?.roomInfo) {
            updateFollowerCount(
                state.roomInfo
            );
        }

        console.log(
            "[TIKTOK] Connection established."
        );

    } catch (error) {

        console.error(
            "[TIKTOK] Connection failed:",
            error
        );

        broadcast({
            type: "status",
            mode: "stream",
            connected: false,
            connecting: false,
            error:
                error?.message ??
                "Could not connect"
        });

        if (
            currentMode === "stream" &&
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

    if (reconnectTimer) {
        return;
    }

    const delay = 5000;

    console.log(
        `[TIKTOK] Reconnecting in ` +
        `${delay / 1000}s...`
    );

    reconnectTimer =
        setTimeout(
            async () => {

                reconnectTimer = null;

                if (
                    currentMode !== "stream" ||
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

    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    if (connection) {

        try {
            await connection.disconnect();
        } catch {}

        connection = null;
    }

    broadcast({
        type: "status",
        mode: "test",
        connected: false,
        connecting: false
    });
}

/* ============================================================
   MODES
   ============================================================ */

async function enterTestMode() {

    console.log(
        "[DOCK] Switching to TEST mode."
    );

    currentMode = "test";

    await disconnectTikTok();

    liveState.viewers =
        testState.viewers;

    liveState.likes =
        testState.likes;

    liveState.totalFollowers =
        testState.totalFollowers;

    liveState.newFollowers =
        testState.newFollowers;

    liveState.gifts =
        testState.gifts;

    liveState.diamonds =
        testState.diamonds;

    liveState.estimatedUsd =
        testState.estimatedUsd;

    liveState.hasAuthoritativeViewerCount =
        false;

    broadcast({
        type: "status",
        mode: "test",
        connected: false,
        connecting: false
    });

    broadcastStats();
}

async function enterStreamMode() {

    console.log(
        "[DOCK] Confirm Live pressed."
    );

    currentMode = "stream";

    liveState.viewers = 0;
    liveState.likes = 0;
    liveState.newFollowers = 0;

    liveState.gifts = 0;
    liveState.diamonds = 0;
    liveState.estimatedUsd = 0;

    liveState.hasAuthoritativeViewerCount =
        false;

    broadcast({
        type: "status",
        mode: "stream",
        connected: false,
        connecting: true
    });

    broadcastStats();

    await connectTikTok();
}

/* ============================================================
   STARTUP
   ============================================================ */

console.log("");
console.log("=================================");
console.log("          TikTok Dock");
console.log("=================================");
console.log(`Username: @${USERNAME}`);
console.log(`Dock: http://localhost:${PORT}`);
console.log("TEST mode enabled.");
console.log("STREAM mode requires confirmation.");
console.log("Extended gift info: DISABLED");
console.log("Hardware monitoring: DISABLED");
console.log(
    `Diamond estimate: $${USD_PER_DIAMOND.toFixed(3)} / diamond`
);
console.log("=================================");
console.log("");