<div align="center">

# Kindalibre Translate

**Prekladač v prehliadači využívajúci API LibreTranslate, bez vlastného servera a s nasadením na GitHub Pages jedným príkazom**

[English](./README.md) · **Slovenčina** · [Deutsch](./README.de.md) · [Українська](./README.uk.md) · [Русский](./README.ru.md)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-→-2f81f7?style=flat-square)](https://jarryuser.github.io/kindalibre-translate/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![LibreTranslate](https://img.shields.io/badge/Powered%20by-LibreTranslate-2f81f7?style=flat-square)](https://libretranslate.com/)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222?style=flat-square&logo=github)](https://pages.github.com/)

</div>

---

## Prehľad

Kindalibre Translate je prekladač, ktorý volá **API LibreTranslate** priamo z prehliadača. Celá aplikácia pozostáva z niekoľkých statických súborov a nepotrebuje vlastný server, databázu ani tajné údaje pri zostavovaní

Napíšte alebo vložte text, vyberte cieľový jazyk a kliknite na **Translate**. Aplikácia podporuje automatické rozpoznanie jazyka, preklad počas písania, výmenu jazykov, kopírovanie, čítanie nahlas a viac než 50 jazykov zo zoznamu LibreTranslate

V predvolenom nastavení aplikácia používa `translate.libregalaxy.org`, bezplatný komunitný server bez požiadavky na API kľúč. V časti **Settings** možno nastaviť inú inštanciu LibreTranslate s povoleným CORS, vrátane oficiálnej platenej služby `libretranslate.com` alebo vlastného servera

**Vyskúšajte:** [jarryuser.github.io/kindalibre-translate](https://jarryuser.github.io/kindalibre-translate/)

---

## Funkcie

| | Funkcia | Podrobnosti |
|---|---|---|
| 🌐 | **Viac než 50 jazykov** | Zoznam jazykov poskytuje LibreTranslate cez `/languages` |
| 🔍 | **Automatické rozpoznanie** | Odošle `source=auto` a zobrazí rozpoznaný jazyk pri zdrojovom texte |
| 🧩 | **Varianty prekladu** | Vyžiada až päť alternatív, ktoré sa dajú vybrať pod výsledkom |
| ⚡ | **Preklad počas písania** | Voliteľný režim, ktorý prekladá po krátkej prestávke v písaní |
| 🔀 | **Výmena jazykov** | Vymení jazykové kódy aj text jedným kliknutím |
| 🔁 | **Klávesová skratka** | Preklad spustíte cez `Ctrl+Enter` alebo `Cmd+Enter` |
| 📋 | **Kopírovanie výsledku** | Skopíruje preklad do schránky a krátko zobrazí potvrdenie |
| 🔊 | **Čítanie nahlas** | Prehliadač prečíta preklad pomocou `speechSynthesis` |
| 🔢 | **Limit znakov** | Načíta `charLimit` inštancie a zablokuje príliš dlhé požiadavky |
| 🔑 | **Voliteľný API kľúč** | Ukladá sa v `localStorage` a odosiela sa vybranej inštancii |
| 🖼️ | **Výber inštancie** | Možno použiť komunitný alebo vlastný server LibreTranslate |
| 🤖 | **Režim LLM** | Preklad cez OpenAI, Anthropic, Groq, OpenRouter alebo rozhranie kompatibilné s OpenAI s vlastným API kľúčom |
| 🌗 | **Tmavá a svetlá téma** | Téma v štýle GitHubu sa zachová aj pri ďalšej návšteve |

---

## Technológie

| Vrstva | Nástroj | Úloha |
|---|---|---|
| Jazyk | TypeScript 5.3 | Prísne typovanie odpovedí API |
| Zostavovanie | Vite 5 | Spracovanie TypeScriptu a vývojový server |
| Preklad | LibreTranslate API | Rozhranie s otvoreným zdrojovým kódom a podporou CORS |
| Hosting | GitHub Pages | Bezplatný statický hosting a nasadenie jedným príkazom |

---

## Ako to funguje

```

Prehliadač (GitHub Pages)
        │
        ▼
   GET /languages          → naplní oba výbery jazyka
   GET /frontend/settings  → charLimit, keyRequired
        │
        ▼
   POST /translate {q, source, target, alternatives?, api_key?}
        │
        ▼
   translatedText → pole s prekladom
   alternatives[] → varianty na výber pod výsledkom
   detectedLanguage → zobrazenie rozpoznaného jazyka
```

Prehliadač posiela požiadavky priamo inštancii LibreTranslate. CORS nastavuje server, napríklad hlavičkou `Access-Control-Allow-Origin: *`, takže aplikácia nepotrebuje proxy

Predvolená adresa `https://translate.libregalaxy.org` patrí komunitnému serveru bez požiadavky na API kľúč a bez limitu znakov. Ak vaša inštancia vyžaduje kľúč, zadajte ho v časti **Settings**. Prehliadač ho uloží do `localStorage` a v požiadavke ho odošle ako `api_key`

### Režim LLM

V ponuke **Settings → Engine → LLM** vyberte poskytovateľa, napríklad OpenAI, Anthropic, Groq, OpenRouter alebo lokálny server kompatibilný s OpenAI. Potom zadajte vlastný API kľúč a vyberte model. Aplikácia zavolá `/chat/completions` alebo `/v1/messages` a očakáva JSON s prekladom, prípadnými variantmi a rozpoznaným jazykom. Nastavenia sa ukladajú v `localStorage`, kľúč sa posiela na nastavenú adresu API a požiadavky sa účtujú podľa podmienok poskytovateľa

---

## Začíname

```bash
git clone https://github.com/jarryuser/kindalibre-translate.git
cd kindalibre-translate
npm install

npm run dev    # → http://localhost:5173
```

---

## Nasadenie

```bash
npm run deploy
```

Príkaz zostaví aplikáciu a zverejní obsah `dist/` so súborom `.nojekyll` do vetvy `gh-pages`. Najviac päť minút čaká, kým živá stránka odkáže na nový súbor JavaScript a súbor bude dostupný. Ak sa to nepodarí, príkaz skončí chybou

Vo forku nastavte `base` v súbore `vite.config.ts` podľa cesty na GitHub Pages a upravte `SITE_URL`

---

## Štruktúra projektu

```
kindalibre-translate/
├── index.html                 - hlavný súbor HTML
├── public/ - statické súbory
│   └── .nojekyll              - vypnutie spracovania cez Jekyll na GitHub Pages
├── scripts/ - skripty
│   └── deploy.mjs             - zverejnenie a kontrola nasadenia
├── src/ - zdrojový kód
│   ├── api.ts                 - klient LibreTranslate a uloženie výberu prekladača a kľúčov
│   ├── llm.ts                 - klient LLM a predvoľby poskytovateľov
│   ├── languages.ts           - zoznam jazykov v režime LLM
│   ├── main.ts                - stav rozhrania, priebeh prekladu a skratky
│   └── style.css              - tmavá a svetlá téma v štýle GitHubu
├── vite.config.ts             - základná cesta pre GitHub Pages
└── tsconfig.json
```

---

## Známe obmedzenia

- **Dostupnosť komunitných serverov** - predvolený server nemá garantovanú dostupnosť. Pri výpadku vyberte inú inštanciu v časti **Settings**
- **Oficiálna inštancia je platená** - `libretranslate.com` vyžaduje kľúč z `portal.libretranslate.com`. LibreTranslate môžete bez licenčného poplatku prevádzkovať aj na vlastnom serveri
- **Limity režimu LLM** - kvalita, cena a počet tokenov závisia od poskytovateľa a modelu
- **Limit znakov** - kladný `charLimit` sa kontroluje pred odoslaním požiadavky. V režime LLM aplikácia limit znakov neuplatňuje
- **Čítanie nahlas** - dostupné hlasy a jazyky závisia od prehliadača a operačného systému

---

## Ako prispieť

Hlásenia problémov a pull requesty sú vítané. Ak nájdete chybu alebo máte nápad na novú funkciu, najprv otvorte issue, aby sme ho mohli prediskutovať

---

## Licencia

MIT © [Dmytro Filiurskyi](https://github.com/jarryuser)
