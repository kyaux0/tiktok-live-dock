# ⚡ TikTok LIVE Dock

### A lightweight, self-hosted TikTok LIVE dashboard built for OBS Studio.

**No TikTok LIVE Studio. No collection of heavyweight browser docks. No unnecessary hardware polling.**

TikTok LIVE Dock connects to a TikTok LIVE through [`tiktok-live-connector`](https://github.com/zerodytrash/TikTok-Live-Connector), processes LIVE events locally with Node.js, and sends them to lightweight browser dashboards through WebSockets.

The goal is simple:

> **Give streamers the LIVE information they actually need without making their streaming PC work harder than necessary.**

---

## 📸 Preview

<img width="1916" height="1019" alt="image" src="https://github.com/user-attachments/assets/8b4ae8de-dcb1-43ae-a32e-1b6c7ed527ba" />

---

## 🚀 Why TikTok LIVE Dock?

Streaming software can become surprisingly resource-heavy when multiple dashboards, browser sources, widgets, and background services are running simultaneously.

TikTok LIVE Dock takes a much simpler approach.

```text
                         TikTok LIVE
                              │
                              ▼
                   TikTok Live Connector
                              │
                              ▼
                        Node.js Server
                              │
                         WebSocket
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
        Statistics Dashboard        Alerts Dashboard
                 │                         │
                 └────────────┬────────────┘
                              ▼
                         OBS Studio
```

Everything runs locally.

Instead of relying on multiple heavyweight services or browser dashboards, TikTok LIVE Dock provides two lightweight dashboards that can be positioned independently inside OBS Studio.

---

# ✨ Features

| Feature | Status |
| --- | :---: |
| 👀 Concurrent viewers | ✅ |
| ❤️ Total likes | ✅ |
| 👥 Total channel followers | ✅ |
| ➕ New LIVE followers | ✅ |
| 💬 LIVE chat | ✅ |
| 🎁 Gifts | ✅ |
| 💎 Diamond tracking | ✅ |
| 💵 Estimated USD | ✅ |
| 👋 Viewer joins | ✅ |
| ⭐ Fan Club events | ✅ |
| 🔄 Automatic reconnect | ✅ |
| 🔴 LIVE connection status | ✅ |
| 🖥️ Separate statistics dashboard | ✅ |
| 📢 Separate alerts dashboard | ✅ |
| 💬 Combined real-time alert feed | ✅ |
| ✨ Automatic joined-user alert fading | ✅ |
| 👤 Change monitored username from dashboard | ✅ |
| 💾 Remember last monitored username | ✅ |
| ⚡ Local WebSocket communication | ✅ |
| 🧪 Test Mode | ❌ Removed |
| 🖥️ Hardware monitoring | ❌ Intentionally removed |
| 🎁 Extended gift catalog | ❌ Intentionally disabled |

---

# 🖥️ Two-Dashboard Design

TikTok LIVE Dock is designed specifically around OBS Studio docks.

Instead of forcing statistics and LIVE activity into one crowded interface, the project separates them into two independent dashboards.

## 📊 Statistics Dashboard

The statistics dashboard focuses on information that should remain visible throughout the entire LIVE:

* 🔴 LIVE connection status
* 👀 Concurrent viewers
* ❤️ Total likes
* 👥 Total channel followers
* ➕ New followers during the current LIVE
* 💎 Diamonds
* 💵 Estimated USD
* 👤 Monitored TikTok username

The username can be changed directly from the dashboard without modifying `server.js`.

The latest username is automatically remembered, so it does not need to be entered every time the dashboard is opened.

This dashboard is intended to be placed near the top of an OBS Studio workspace.

## 📢 Alerts Dashboard

The alerts dashboard contains a single combined LIVE activity feed.

It displays:

* 💬 Comments
* 🎁 Gifts
* ➕ New followers
* 👋 Viewers joining the LIVE
* ⭐ Fan Club events

Keeping everything in one feed allows comments to remain highly visible even when chat activity becomes fast.

### 👋 Joined LIVE alerts

Joined LIVE alerts are temporary.

They automatically fade out after a configurable amount of time and smoothly disappear from the feed, allowing newer alerts to move into their place without creating unnecessary clutter.

This keeps the dashboard readable during high viewer activity.

### ➕ Follow alerts

Follow alerts are intentionally compact.

They display only:

* ➕ Follow icon
* Username

The additional `"followed you"` text is omitted to save vertical space.

### 👋 Join alerts

Join alerts are also intentionally compact.

They display only:

* 👋 Join icon
* Username

The `"joined the LIVE"` text is omitted because the icon already communicates the event.

### 🎁 Gift and ⭐ Fan Club alerts

Gift and Fan Club alerts display the sender prominently while keeping the event content clearly readable underneath.

For gifts, this includes information such as the gift name and quantity.

---

# 🧠 How It Works

The server establishes a connection to the configured TikTok LIVE and listens for supported Webcast events.

Those events are converted into small JSON messages and broadcast to all connected dashboard clients over WebSocket.

For example:

```json
{
  "type": "gift",
  "user": "viewer123",
  "giftName": "Rose",
  "repeatCount": 3
}
```

The browser receives the event and immediately updates the appropriate dashboard.

Because both dashboards connect to the same WebSocket server, they remain synchronized automatically.

There is no need to run a separate backend for each dashboard.

---

# 📊 Supported LIVE Events

## 💬 Chat

Receives:

* Username
* Display name
* Message

Comments are displayed in the combined alerts feed and are optimized for fast-moving chat.

---

## 🎁 Gifts

Receives basic gift information including:

* Sender
* Gift name
* Quantity
* Gift ID when available
* Gift type when available
* Streak state when available

Extended gift information is intentionally disabled.

---

## 👋 Viewer Joins

Displays users entering the LIVE when the corresponding event is received.

Join alerts are temporary and automatically fade from the alerts dashboard after the configured timeout.

---

## ➕ Follows

Tracks new followers received during the current LIVE.

The dashboard also maintains the total channel follower count when TikTok provides the corresponding information.

---

## ⭐ Fan Club

Displays Fan Club-related events exposed by the connector.

These are shown alongside gifts and other LIVE activity in the combined alerts feed.

---

## ❤️ Likes

Uses TikTok's reported total like count when available.

The server also has fallback handling for individual like events when a total is not provided.

---

## 👀 Viewers

Uses the authoritative room viewer count when available.

If it has not been received yet, the server can temporarily use a `MEMBER` event's count as a fallback.

---

# 🎁 Gifts & Diamonds

TikTok's basic LIVE events can provide information such as:

```text
Gift: Rose
Quantity: 3
```

However, the full TikTok gift catalog and its associated values are part of the connector's extended gift functionality.

This project intentionally keeps:

```js
enableExtendedGiftInfo: false
```

That avoids requiring the additional signing infrastructure used for extended gift information.

The project can therefore work with the basic gift information without depending on that service.

Diamond tracking is calculated from the gift information received by the connector.

Any diamond or USD calculation implemented by the project should be treated as an **estimate**, not an official TikTok payout statement.

---

# 🔴 LIVE Connection

The dashboard provides a clear connection status:

```text
🔴 LIVE CONNECTED
```

or

```text
⚫ LIVE DISCONNECTED
```

When a connection unexpectedly drops, the server can automatically attempt to reconnect.

Both dashboards receive the same connection state through the WebSocket server.

---

# 👤 Username Configuration

The monitored TikTok username no longer needs to be hard-coded in `server.js`.

The statistics dashboard provides an input where the username can be changed directly.

The latest username is remembered locally, allowing it to be loaded automatically the next time the dashboard is opened.

This makes it possible to switch between monitored LIVE accounts without modifying the source code.

---

# ⚡ Lightweight by Design

TikTok LIVE Dock is deliberately small.

The server:

* Does not continuously poll hardware statistics.
* Does not run unnecessary background monitoring.
* Uses WebSockets for event delivery.
* Runs the dashboards locally.
* Keeps the browser UI intentionally minimal.
* Allows the statistics and alerts interfaces to be separated inside OBS Studio.

On the developer's streaming setup, the Dock has been observed running at approximately **1–2% CPU** while active.

Actual resource usage will vary depending on the system and workload.

---

# 🛠️ Installation

## Requirements

* [Node.js](https://nodejs.org/)
* A TikTok account capable of starting a LIVE
* OBS Studio if you want to use the Dock alongside OBS

## Clone

```bash
git clone https://github.com/kyaux0/tiktok-live-dock.git
cd tiktok-live-dock
```

## Install dependencies

```bash
npm install
```

## Configure

The monitored TikTok username can be configured directly from the dashboard.

There is no need to edit the source code every time the monitored account changes.

## Start

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

The dashboard will allow you to configure the monitored username and connect to the LIVE.

---

# 📁 Project Structure

```text
tiktok-live-dock/
│
├── public/
│   ├── index.html
│   └── alerts.html
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

# 🔌 Architecture

The project consists of three simple layers.

## 1. TikTok connection

`TikTokLiveConnection` receives LIVE events.

## 2. Node.js server

Express serves the dashboards while WebSocket broadcasts events to all connected clients.

The server maintains the shared LIVE state, including:

* Viewer count
* Like count
* Follower count
* New LIVE followers
* Diamonds
* Estimated USD
* LIVE connection state

## 3. Browser dashboards

The browser dashboards receive events through WebSocket and render the corresponding information.

Both dashboards connect to the same backend.

```text
                         ┌──────────────────────┐
                         │      TikTok LIVE     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ tiktok-live-connector│
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     Node.js Server   │
                         │                      │
                         │ Express + WebSocket  │
                         └──────────┬───────────┘
                                    │
                         ┌──────────┴──────────┐
                         │                     │
                         ▼                     ▼
                ┌─────────────────┐   ┌─────────────────┐
                │ Statistics Dock │   │  Alerts Dock    │
                │                 │   │                 │
                │ Viewers         │   │ Comments        │
                │ Likes           │   │ Gifts           │
                │ Followers       │   │ Follows         │
                │ New Followers   │   │ Joins           │
                │ Diamonds        │   │ Fan Club        │
                │ Est. USD        │   │                 │
                └────────┬────────┘   └────────┬────────┘
                         │                     │
                         └──────────┬──────────┘
                                    ▼
                              OBS Studio
```

---

# 🗺️ Roadmap

Potential future improvements:

* [ ] Improved gift/diamond handling
* [ ] More LIVE event types
* [ ] Customizable dashboard layout
* [ ] Custom themes
* [ ] Better event filtering
* [ ] Persistent LIVE statistics
* [ ] More OBS-focused integration
* [ ] Installation/setup improvements
* [ ] Additional dashboard customization
* [ ] More configurable alert behavior

The roadmap is intentionally flexible and will evolve as the project develops.

---

# 🤝 Contributing

Contributions, bug reports, feature requests, and improvements are welcome.

If you find a problem:

1. Check the existing issues.
2. Open a new issue with reproduction steps and relevant console output.
3. For code changes, open a pull request.

Please avoid posting private account information, authentication credentials, cookies, or tokens.

---

# ⚠️ Disclaimer

**TikTok LIVE Dock is an unofficial community project.**

It is not affiliated with, endorsed by, or sponsored by TikTok.

This project uses [`tiktok-live-connector`](https://github.com/zerodytrash/TikTok-Live-Connector) to receive LIVE data.

TikTok may change its systems or LIVE endpoints at any time, which can affect functionality.

---

# 📄 License

This project is licensed under the **MIT License**.

See [`LICENSE`](LICENSE) for details.

---

## ⭐ Like the project?

If TikTok LIVE Dock is useful to you, consider giving the repository a ⭐.

It helps the project get discovered and motivates further development.

**Built for streamers who want their PC to spend its resources on the stream — not the dashboard.**
