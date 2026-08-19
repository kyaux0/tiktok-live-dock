# ⚡ TikTok LIVE Dock

### A lightweight, self-hosted TikTok LIVE dashboard built for OBS Studio.

**No TikTok LIVE Studio. No heavyweight browser docks. No unnecessary background monitoring.**

TikTok LIVE Dock connects to a TikTok LIVE through [`tiktok-live-connector`](https://github.com/zerodytrash/TikTok-Live-Connector), processes LIVE events locally with Node.js, and sends them to lightweight browser dashboards through WebSockets.

The goal is simple:

> **Give streamers the LIVE information they actually need without making their streaming PC work harder than necessary.**

---

## 📸 Preview

<img width="1916" height="1019" alt="image" src="https://github.com/user-attachments/assets/8b4ae8de-dcb1-43ae-a32e-1b6c7ed527ba" />

---

# ✨ Features

| Feature | Status |
| --- | :---: |
| 👀 Concurrent viewers | ✅ |
| ❤️ Total likes | ✅ |
| 👥 Total channel followers | ✅ |
| ➕ New LIVE followers | ✅ |
| 💬 LIVE comments | ✅ |
| 🎁 Gift tracking | ✅ |
| 💎 Diamond tracking | ✅ |
| 💵 Estimated USD | ✅ |
| 👋 Viewer joins | ✅ |
| ⭐ Fan Club events | ✅ |
| 🔄 Automatic reconnect | ✅ |
| 🔴 LIVE connection status | ✅ |
| 📊 Statistics dashboard | ✅ |
| 📢 Alerts dashboard | ✅ |
| 💬 Combined real-time activity feed | ✅ |
| 🔊 Configurable sound alerts | ✅ |
| ❤️ Like milestone sound alerts | ✅ |
| 💾 Saved username/configuration | ✅ |
| ⚡ Local WebSocket communication | ✅ |
| 🖥️ Hardware monitoring | ❌ |
| 🧪 Test Mode | ❌ |

---

# 🖥️ Two-Dashboard Design

TikTok LIVE Dock provides two independent dashboards designed specifically for use as OBS Studio docks.

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

## 📊 Statistics Dashboard

The Statistics Dock is available at:

```text
http://localhost:3000/
```

It displays:

* 🔴 LIVE connection status
* 👀 Concurrent viewers
* ❤️ Total likes
* 👥 Total channel followers
* ➕ New followers during the current LIVE
* 💎 Diamonds
* 💵 Estimated USD
* 👤 Monitored TikTok username
* 🔊 Sound alert controls

The monitored username can be changed directly from the dashboard.

### 🔌 Connecting to a LIVE

**The Dock does not automatically attempt to connect when it starts.**

The user must configure the monitored username and click:

> **Save & Connect**

Only then does the server begin attempting to connect to the TikTok LIVE.

This prevents the Dock from unexpectedly attempting connections simply because the dashboard was opened.

The configured username and relevant settings are saved locally in:

```text
dock-config.json
```

---

# 📢 Alerts Dashboard

The Alerts Dock is available at:

```text
http://localhost:3000/alerts.html
```

It contains a combined real-time activity feed displaying:

* 💬 Comments
* 🎁 Gifts
* ➕ New followers
* 👋 Viewers joining
* ⭐ Fan Club events

Keeping events in one feed allows all important LIVE activity to remain visible without requiring multiple browser dashboards.

---

## 💬 Comments

Comment alerts display:

* 💬 Comment icon
* Username
* Comment content

Comments appear in real time as they are received from the LIVE.

---

## 🎁 Gifts

Gift alerts display relevant information including:

* 🎁 Gift icon
* Sender
* Gift name
* Quantity
* Diamond value
* Estimated USD value

Diamond and USD values are estimates based on the gift information available through the connector.

---

## ➕ Follow Alerts

Follow alerts are intentionally compact.

They display:

* ➕ Follow icon
* Username

---

## 👋 Join Alerts

Join alerts display:

* 👋 Join icon
* Username

Join notifications are temporary and automatically fade from the feed to prevent the dashboard from becoming unnecessarily cluttered.

---

## ⭐ Fan Club Alerts

Fan Club-related events exposed by the connector are displayed alongside other LIVE activity.

---

# 🔊 Sound Alerts

TikTok LIVE Dock supports configurable sound alerts.

**Sound alerts are disabled by default.**

Users can enable or disable the available sound notifications from the Statistics Dock.

Sound notifications can be used for LIVE activity such as supported gifts and like milestones.

### ❤️ Like Milestones

The Dock can play a sound when a configured like milestone is reached, allowing streamers to receive an audible notification without constantly watching the dashboard.

---

# 🧠 How It Works

The server establishes a connection to the configured TikTok LIVE and listens for supported Webcast events.

Events are processed locally and broadcast to connected dashboard clients through WebSockets.

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

Both dashboards communicate with the same Node.js backend, keeping their information synchronized.

---

# 📊 Supported LIVE Events

## 💬 Chat

Receives:

* Username
* Display name
* Message

Comments are displayed in the combined Alerts Dock.

---

## 🎁 Gifts

Receives basic gift information including:

* Sender
* Gift name
* Quantity
* Gift ID when available
* Gift type when available
* Streak state when available

Extended gift information remains disabled.

The project uses:

```js
enableExtendedGiftInfo: false
```

This keeps the project lightweight and avoids requiring the additional signing infrastructure associated with extended gift information.

---

## 💎 Diamonds & Estimated USD

Diamond values are calculated from the gift information received by the connector.

The Dock also provides an estimated USD value.

These values should be treated as **estimates**, not official TikTok payout figures.

---

## 👋 Viewer Joins

Displays users entering the LIVE when the corresponding event is received.

Join alerts automatically fade from the Alerts Dock after the configured timeout.

---

## ➕ Follows

Tracks new followers received during the current LIVE.

The Statistics Dock also maintains the total channel follower count when the corresponding information is available.

---

## ⭐ Fan Club

Displays Fan Club-related events exposed by the connector.

---

## ❤️ Likes

Tracks the reported total like count when available.

The Dock also supports like milestone sound notifications.

---

## 👀 Viewers

Displays the current LIVE viewer count using the available room statistics.

---

# 🔴 LIVE Connection

The Statistics Dock provides a clear connection status:

```text
🔴 LIVE CONNECTED
```

or

```text
⚫ LIVE DISCONNECTED
```

If an established connection unexpectedly drops, the server can automatically attempt to reconnect.

**Automatic reconnect only applies after the user has explicitly connected using `Save & Connect`.**

Opening the Dock by itself does not initiate a LIVE connection.

---

# 👤 Username & Configuration

The monitored TikTok username does not need to be hard-coded into `server.js`.

It can be configured directly through the Statistics Dock.

After clicking:

> **Save & Connect**

the configuration is saved locally in:

```text
dock-config.json
```

This allows the Dock to remember its configuration between sessions.

---

# ⚡ Lightweight by Design

TikTok LIVE Dock is deliberately lightweight.

The server:

* Does not continuously poll hardware statistics.
* Does not run unnecessary background monitoring.
* Uses WebSockets for event delivery.
* Runs the dashboards locally.
* Keeps the browser UI minimal.
* Separates statistics from alerts.
* Uses a single Node.js backend for both dashboards.

Actual CPU and memory usage will vary depending on the system and workload.

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

## Start

Run:

```text
start.bat
```

`start.bat` handles starting the TikTok LIVE Dock automatically.

Once the Dock is running, open:

```text
http://localhost:3000
```

The Dock will **not** attempt to connect to a TikTok LIVE automatically.

Configure the monitored username and click **Save & Connect** to begin monitoring the LIVE.

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
├── start.bat
├── package.json
├── package-lock.json
├── dock-config.json
├── .gitignore
└── README.md
```

---

# 🔌 Architecture

The project consists of three main layers.

## 1. TikTok Connection

`TikTokLiveConnection` receives LIVE events.

## 2. Node.js Server

Express serves the dashboards while WebSocket broadcasts events to connected clients.

The server maintains shared LIVE state including:

* Viewer count
* Like count
* Follower count
* New LIVE followers
* Diamonds
* Estimated USD
* LIVE connection state

## 3. Browser Dashboards

The browser dashboards receive events through WebSocket and render the corresponding information.

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
                │ Sound Controls  │   │                 │
                └─────────────────┘   └─────────────────┘
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

This project is licensed under the **ISC License**.

See [`LICENSE`](LICENSE) for details.

---

## ⭐ Like the project?

If TikTok LIVE Dock is useful to you, consider giving the repository a ⭐.

It helps the project get discovered and motivates further development.

**Built for streamers who want their PC to spend its resources on the stream — not the dashboard.**
