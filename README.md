# Ernest — URL Shortener

> Make your links short, sharp, and shareable.

A feature-rich, animated URL shortener built with vanilla HTML, CSS, and JavaScript. Paste any long URL, get a compact TinyURL link instantly — with QR code generation, persistent history, live particle background, dark/light theming, and live stats.

---

## 🌐 Live Demo

**[https://ernestgfx.github.io/url-shortener/](https://ernestgfx.github.io/url-shortener/)**

---

## ✨ Features

- **Instant URL shortening** via the TinyURL API
- **QR Code generation** — view and download a QR for any shortened link
- **Persistent history** — last 20 links saved in `localStorage`
- **Duplicate detection** — cached results returned without re-hitting the API
- **Copy / Open / QR** action buttons on every result
- **Live stats** — total links, characters saved, and session count
- **Dark / Light theme** — persisted across sessions
- **Live particle canvas** — animated network of connected particles
- **Cursor glow** — ambient glow that follows your mouse
- **Typewriter hero** — animated headline cycles through phrases
- **Scroll reveal** — elements animate in as they enter the viewport
- **Button ripple effects** — tactile click feedback
- **Character counter** on the input field
- **Toast notifications** for all actions
- **Loading spinner** while API call is in progress
- **Keyboard shortcut** — press `Enter` to shorten
- Fully **responsive** down to 320px

---

## 🛠 Technologies Used

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, glassmorphism, CSS animations) |
| Logic | Vanilla JavaScript (ES2020+) |
| URL API | [TinyURL API](https://tinyurl.com/app/dev) |
| QR Library | [qrcodejs](https://github.com/davidshimjs/qrcodejs) — loaded on demand via CDN |
| Fonts | [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue) + [Manrope](https://fonts.google.com/specimen/Manrope) + [DM Mono](https://fonts.google.com/specimen/DM+Mono) via Google Fonts |
| Storage | `localStorage` (no backend required) |
| Hosting | GitHub Pages |

---

## 📁 Project Structure

```
url-shortener/
├── index.html      # App markup and layout
├── style.css       # Styling — theming, animations, glassmorphism, responsive
├── java.js         # App logic — particles, cursor, typewriter, API, QR, history
└── README.md
```

---

## 🚀 Setup Instructions

This is a **pure frontend project** — no backend, no build step, no dependencies to install.

### Run locally

```bash
# 1. Clone the repo
git clone https://github.com/ernestgfx/url-shortener.git

# 2. Navigate into the folder
cd url-shortener

# 3. Open in your browser
open index.html
# or just double-click index.html in your file explorer
```

> **Note:** The TinyURL API key is bundled in `java.js`. The API has a free-tier rate limit — if requests fail, wait a moment and try again.

### Deploy to GitHub Pages

```bash
git add .
git commit -m "deploy"
git push origin main
```

Then go to **Settings → Pages → Source → main / root** in your GitHub repo.

---

## 🔑 API Reference

| Detail | Value |
|---|---|
| Endpoint | `POST https://api.tinyurl.com/create` |
| Auth | Bearer token in `Authorization` header |
| Payload | `{ "url": "<long_url>" }` |
| Response field | `data.tiny_url` |

To use your own key, replace `API_KEY` at the top of `java.js`:

```js
const API_KEY = "your_tinyurl_api_key_here";
```

Get a free key at [tinyurl.com/app/dev](https://tinyurl.com/app/dev).

## Ai Usages

AI tools such as Cluade were used to assist with code structure, debugging, and feature suggestions. The generated code was reviewed, modified, and integrated manually. All functionality is understood and can be explained.

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<p align="center">Built by <a href="https://github.com/ernestgfx">Ernest</a></p>