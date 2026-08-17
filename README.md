<div align="center">

# Kindalibre Translate

**A "kinda libre" browser translator powered by the LibreTranslate API - no backend, deployable on GitHub Pages in one command**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-→-2f81f7?style=flat-square)](https://jarryuser.github.io/kindalibre-translate/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![LibreTranslate](https://img.shields.io/badge/Powered%20by-LibreTranslate-2f81f7?style=flat-square)](https://libretranslate.com/)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222?style=flat-square&logo=github)](https://pages.github.com/)

</div>

---

## Overview

Kindalibre Translate is a front-end translator that calls the **LibreTranslate API** directly from the browser. There is no server, no database and no build-time secrets - the whole app is a handful of static files

Type or paste text, pick a target language, hit **Translate**. Supports auto-detection, live translation, language swapping, copy, text-to-speech and 50+ languages from the same list LibreTranslate itself uses

The app talks to any LibreTranslate instance and is CORS-ready. The default is `translate.libregalaxy.org`, a free community mirror that needs no API key. The official `libretranslate.com` is paid, but you can point the app at any self-hosted or community instance in **Settings**

**Try it:** [kindalibre-translate.jarryuser.github.io](https://jarryuser.github.io/kindalibre-translate/)

---

## Features

| | Feature | Details |
|---|---|---|
| 🌐 | **50+ languages** | Same language list LibreTranslate serves via `/languages` |
| 🔍 | **Auto-detect** | Sends `source=auto`, shows the detected language next to the source box |
| 🧩 | **Translation variants** | Requests up to 5 alternative translations, clickable under the result |
| ⚡ | **Live mode** | Optional debounced translate-as-you-type toggle |
| 🔀 | **Swap languages** | Swaps codes and text in one click |
| 🔁 | **Keyboard shortcut** | `Ctrl+Enter` (or `Cmd+Enter`) to translate |
| 📋 | **Copy result** | Clipboard with a short confirmation state |
| 🔊 | **Listen** | Browser `speechSynthesis` reads the translation aloud |
| 🔢 | **Char limit guard** | Reads the instance `charLimit`, blocks oversized requests |
| 🔑 | **Optional API key** | Stored only in `localStorage`, never sent anywhere else |
| 🖼️ | **Any instance** | Point the app at a self-hosted or community LibreTranslate mirror |
| 🤖 | **LLM mode** | Optional second engine: translate with an LLM (OpenAI, Anthropic, Groq, OpenRouter, or any OpenAI-compatible endpoint) using your own API key for dramatically better quality |
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
   POST /translate {q, source, target, alternatives?, api_key?}
        │
        ▼
   translatedText → target pane
   alternatives[] → clickable variant list under the result
   detectedLanguage → "Detected: Ukrainian" badge
```

All API calls go straight from the page to the LibreTranslate instance. CORS is handled server-side with `Access-Control-Allow-Origin: *`, so no proxy is needed

The app defaults to `https://translate.libregalaxy.org`, a free community mirror with no key required and no character limit. If you use an instance that does require a key (like the official `libretranslate.com`), paste it into **Settings** - it lives only in your browser's `localStorage` and is attached as `api_key` on each request

### LLM mode

Argos-based LibreTranslate models are mediocre, so **Settings → Engine → LLM** swaps the backend for a large language model of your choice. Pick a provider (OpenAI, Anthropic, Groq, OpenRouter or any OpenAI-compatible endpoint incl. local servers), paste your API key, pick a model. The app sends a single `/chat/completions` or `/v1/messages` request that returns the translation (plus alternatives and auto-detected language) as JSON. Keys and settings stay in `localStorage` and are only ever sent to the provider you selected. You pay nothing extra - calls are billed to your own key

---

## Getting started

```bash
git clone https://github.com/jarryuser/kindalibre-translate.git
cd kindalibre-translate
npm install

npm run dev    # → http://localhost:5173
```

---

## Deploying

```bash
npm run deploy
```

Builds the app and pushes `dist/` to the `gh-pages` branch with `gh-pages`. The live site updates at `https://jarryuser.github.io/kindalibre-translate/` in ~30 seconds

If you fork the repo, the `base` path in `vite.config.ts` must match your GitHub Pages subpath

---

## Project structure

```
kindalibre-translate/
├── index.html                 - single HTML shell
├── src/
│   ├── api.ts                 - LibreTranslate client (languages, settings, translate) + engine/key storage
│   ├── llm.ts                 - LLM client (OpenAI-compatible + Anthropic) + provider presets
│   ├── languages.ts           - static language list used in LLM mode
│   ├── main.ts                - UI state, translation flow, shortcuts
│   └── style.css              - GitHub-style dark/light theme
├── vite.config.ts             - sets the GitHub Pages base path
└── tsconfig.json
```

---

## Known limitations

- **Community mirrors can go down** - the default `translate.libregalaxy.org` is free and keyless, but not SLA-backed. If it stops responding, switch to another mirror or a self-hosted instance in Settings
- **Official instance is paid** - `libretranslate.com` returns `keyRequired: true`; it needs a key from `portal.libretranslate.com`. Self-hosted LibreTranslate is free and unlimited
- **LLM mode uses your key and its limits** - quality and pricing depend on the provider/model you pick. The key never leaves your browser, but it is sent directly to the chosen provider
- **Instance-dependent limits** - if an instance sets a positive `charLimit`, oversized requests are blocked client-side. The default mirror reports no limit. In LLM mode there is no char limit (token limits depend on the model)
- **Speech is browser-dependent** - `speechSynthesis` voices and language support vary by OS and browser

---

## Contributing

Issues and pull requests are welcome. If you spot a bug or have a feature idea, open an issue first so we can discuss it

---

## License

MIT © [Dmytro Filiurskyi](https://github.com/jarryuser)