<div align="center">

# Libre Translate

**A minimal, key-free browser translator powered by the LibreTranslate API - no backend, deployable on GitHub Pages in one command**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-→-2f81f7?style=flat-square)](https://jarryuser.github.io/libretranslate/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![LibreTranslate](https://img.shields.io/badge/Powered%20by-LibreTranslate-2f81f7?style=flat-square)](https://libretranslate.com/)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222?style=flat-square&logo=github)](https://pages.github.com/)

</div>

---

## Overview

Libre Translate is a front-end translator that calls the **LibreTranslate API** directly from the browser. There is no server, no database and no build-time secrets - the whole app is a handful of static files

Type or paste text, pick a target language, hit **Translate**. Supports auto-detection, live translation, language swapping, copy, text-to-speech and 50+ languages from the same list LibreTranslate itself uses

The app talks to any LibreTranslate instance and is CORS-ready: `libretranslate.com` works out of the box. The official instance now requires a free API key, but the key stays in your browser's `localStorage` and can be swapped for any community or self-hosted instance

**Try it:** [libretranslate.jarryuser.github.io](https://jarryuser.github.io/libretranslate/)

---

## Features

| | Feature | Details |
|---|---|---|
| 🌐 | **50+ languages** | Same language list LibreTranslate serves via `/languages` |
| 🔍 | **Auto-detect** | Sends `source=auto`, shows the detected language next to the source box |
| ⚡ | **Live mode** | Optional debounced translate-as-you-type toggle |
| 🔀 | **Swap languages** | Swaps codes and text in one click |
| 🔁 | **Keyboard shortcut** | `Ctrl+Enter` (or `Cmd+Enter`) to translate |
| 📋 | **Copy result** | Clipboard with a short confirmation state |
| 🔊 | **Listen** | Browser `speechSynthesis` reads the translation aloud |
| 🔢 | **Char limit guard** | Reads the instance `charLimit`, blocks oversized requests |
| 🔑 | **Optional API key** | Stored only in `localStorage`, never sent anywhere else |
| 🖼️ | **Any instance** | Point the app at a self-hosted or community LibreTranslate mirror |
| 🌗 | **Dark / light theme** | GitHub-style theme toggle, persisted across visits |

---

## Tech stack

| Layer | Tool | Why |
|---|---|---|
| Language | TypeScript 5.3 | Strict typing for API responses |
| Bundler | Vite 5 | Zero-config TS, instant dev server |
| Translation | LibreTranslate API | Free, open-source, CORS-enabled |
| Front-end host | GitHub Pages | Free static hosting, one command deploy |

---

## How it works

```
Browser (GitHub Pages)
        │
        ▼
   fetch /languages          → populate both language selects
   fetch /frontend/settings  → charLimit, keyRequired
        │
        ▼
   POST /translate {q, source, target, api_key?}
        │
        ▼
   translatedText → target pane
   detectedLanguage → "Detected: Ukrainian" badge
```

All API calls go straight from the page to the LibreTranslate instance. CORS is handled server-side with `Access-Control-Allow-Origin: *`, so no proxy is needed

The app defaults to `https://libretranslate.com`. Since mid-2025 the official instance requires a free API key - get one at `portal.libretranslate.com` and paste it into **Settings**. The key is never committed anywhere: it lives in your browser's `localStorage` and is attached as `api_key` on each request

---

## Getting started

```bash
git clone https://github.com/jarryuser/libretranslate.git
cd libretranslate
npm install

npm run dev    # → http://localhost:5173
```

---

## Deploying

```bash
npm run deploy
```

Builds the app and pushes `dist/` to the `gh-pages` branch with `gh-pages`. The live site updates at `https://jarryuser.github.io/libretranslate/` in ~30 seconds

If you fork the repo, the `base` path in `vite.config.ts` must match your GitHub Pages subpath

---

## Project structure

```
libretranslate/
├── index.html                 - single HTML shell
├── src/
│   ├── api.ts                 - LibreTranslate client (languages, settings, translate)
│   ├── main.ts                - UI state, translation flow, shortcuts
│   └── style.css              - GitHub-style dark/light theme
├── vite.config.ts             - sets the GitHub Pages base path
└── tsconfig.json
```

---

## Known limitations

- **Official instance needs a free key** - libretranslate.com now returns `keyRequired: true`. Add a key in Settings, or switch the instance URL to a community mirror / self-hosted server
- **Free keys are rate-limited** - the official portal enforces a daily character quota. Live mode is off by default to help you stay under it
- **Requests are capped at the instance `charLimit`** (2000 on libretranslate.com). Larger texts are blocked client-side
- **Speech is browser-dependent** - `speechSynthesis` voices and language support vary by OS and browser

---

## Contributing

Issues and pull requests are welcome. If you spot a bug or have a feature idea, open an issue first so we can discuss it

---

## License

MIT © [Dmytro Filiurskyi](https://github.com/jarryuser)