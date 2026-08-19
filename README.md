# ⚡ TikTok LIVE Dock

### A lightweight, self-hosted TikTok LIVE dashboard built for OBS Studio.

**No TikTok LIVE Studio. No collection of heavyweight browser docks. No unnecessary hardware polling.**

TikTok LIVE Dock connects to a TikTok LIVE through [`tiktok-live-connector`](https://github.com/zerodytrash/TikTok-Live-Connector), processes LIVE events locally with Node.js, and sends them to a minimal browser dashboard through WebSockets.

The goal is simple:

> **Give streamers the LIVE information they actually need without making their streaming PC work harder than necessary.**

---

## 📸 Preview

<img width="734" height="708" alt="image" src="https://github.com/user-attachments/assets/d804b4b2-735f-4b7b-ad14-6198377d6edd" />

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
                      ▼
              Local Web Dashboard
                      │
                      ▼
                 OBS Studio
```

Everything runs locally.

There is no need to keep a collection of separate browser docks running just to monitor basic LIVE activity.

---

## ✨ Features

| Feature                         |          Status          |
| ------------------------------- | :----------------------: |
| 👀 Concurrent viewers           |             ✅            |
| ❤️ Total likes                  |             ✅            |
| 👥 Total channel followers      |             ✅            |
| ➕ New LIVE followers            |             ✅            |
| 💬 LIVE chat                    |             ✅            |
| 🎁 Gifts                        |             ✅            |
| 👋 Viewer joins                 |             ✅            |
| ⭐ Fan Club events               |             ✅            |
| 🔄 Automatic reconnect          |             ✅            |
| 🧪 Test Mode                    |             ✅            |
| 🔴 Stream Mode                  |             ✅            |
| ⚡ Local WebSocket communication |             ✅            |
| 🖥️ Hardware monitoring         |  ❌ Intentionally removed |
| 🎁 Extended gift catalog        | ❌ Intentionally disabled |

---

# 🧠 How It Works

The server establishes a connection to the configured TikTok LIVE and listens for supported Webcast events.

Those events are converted into small JSON messages and broadcast to connected dashboard clients over WebSocket.

For example:

```json
{
  "type": "gift",
  "user": "viewer123",
  "giftName": "Rose",
  "repeatCount": 3
}
```

The browser receives the event and immediately updates the interface.

This avoids constantly polling the server for new information.

---

# 📊 Supported LIVE Events

### 💬 Chat

Receives:

* Username
* Display name
* Message

### 🎁 Gifts

Receives basic gift information including:

* Sender
* Gift name
* Quantity
* Gift ID when available
* Gift type when available
* Streak state when available

Extended gift information is intentionally disabled.

### 👋 Viewer Joins

Displays users entering the LIVE when the corresponding event is received.

### ➕ Follows

Tracks new followers received during the current LIVE.

### ⭐ Fan Club

Displays Fan Club-related events exposed by the connector.

### ❤️ Likes

Uses TikTok's reported total like count.

### 👀 Viewers

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

Any diamond or USD calculation implemented by the project should be treated as an **estimate**, not an official TikTok payout statement.

---

# 🧪 Test Mode

You don't need to start a LIVE every time you want to test the dashboard.

Test Mode generates simulated:

* Chat messages
* Gifts
* Follows
* Viewer joins
* Fan Club events
* Likes
* Viewer counts

This makes it possible to test the UI and OBS setup safely before going LIVE.

---

# 🔴 Stream Mode

When you're ready:

1. Open the dashboard.
2. Select **Stream Mode**.
3. Click **Confirm Live**.
4. The Node.js server connects to the configured TikTok username.
5. LIVE events begin appearing in the dashboard.

If the connection unexpectedly drops, the server can automatically attempt to reconnect.

---

# ⚡ Lightweight by Design

TikTok LIVE Dock is deliberately small.

The server:

* Does not continuously poll hardware statistics.
* Does not run unnecessary background monitoring.
* Uses WebSockets for event delivery.
* Runs the dashboard locally.
* Keeps the browser UI intentionally minimal.

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

## Configure your account

Open:

```text
server.js
```

Find:

```js
const USERNAME = "your_username";
```

Replace it with the TikTok username you want to monitor.

## Start

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

---

# 📁 Project Structure

```text
tiktok-live-dock/
│
├── public/
│   └── index.html
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

# 🔌 Architecture

The project consists of three simple layers:

### 1. TikTok connection

`TikTokLiveConnection` receives LIVE events.

### 2. Node.js server

Express serves the dashboard while WebSocket broadcasts events to connected clients.

### 3. Browser dashboard

`index.html` receives the events and renders the statistics and Actions Feed.

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
           ▼
┌──────────────────────┐
│   Browser Dashboard  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      OBS Studio      │
└──────────────────────┘
```

---

# 🗺️ Roadmap

Potential future improvements:

* [ ] Improved gift/diamond handling
* [ ] More LIVE event types
* [ ] Customizable dashboard layout
* [ ] Configurable username without editing source code
* [ ] Custom themes
* [ ] Better event filtering
* [ ] Persistent LIVE statistics
* [ ] More OBS-focused integration
* [ ] Installation/setup improvements

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
