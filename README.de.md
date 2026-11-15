<div align="center">

# Kindalibre Translate

**Übersetzer im Browser mit der LibreTranslate-API, ohne eigenen Server und mit Veröffentlichung auf GitHub Pages per Befehl**

[English](./README.md) · [Slovenčina](./README.sk.md) · **Deutsch** · [Українська](./README.uk.md) · [Русский](./README.ru.md)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-→-2f81f7?style=flat-square)](https://jarryuser.github.io/kindalibre-translate/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![LibreTranslate](https://img.shields.io/badge/Powered%20by-LibreTranslate-2f81f7?style=flat-square)](https://libretranslate.com/)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222?style=flat-square&logo=github)](https://pages.github.com/)

</div>

---

## Überblick

Kindalibre Translate ist ein Übersetzer, der die **LibreTranslate-API** direkt aus dem Browser aufruft. Die Anwendung besteht aus wenigen statischen Dateien und benötigt weder einen eigenen Server noch eine Datenbank oder Zugangsdaten beim Build

Gib Text ein oder füge ihn ein, wähle eine Zielsprache und klicke auf **Translate**. Die App unterstützt automatische Spracherkennung, Übersetzung während der Eingabe, Sprachtausch, Kopieren, Vorlesen und über 50 Sprachen aus der Liste von LibreTranslate

Standardmäßig verwendet die App `translate.libregalaxy.org`, einen kostenlosen Community-Server ohne API-Schlüssel. Unter **Settings** lässt sich jede LibreTranslate-Instanz mit CORS-Unterstützung eintragen, etwa der kostenpflichtige offizielle Dienst `libretranslate.com` oder ein selbst betriebener Server

**Ausprobieren:** [jarryuser.github.io/kindalibre-translate](https://jarryuser.github.io/kindalibre-translate/)

---

## Funktionen

| | Funktion | Details |
|---|---|---|
| 🌐 | **Über 50 Sprachen** | LibreTranslate liefert die Sprachliste über `/languages` |
| 🔍 | **Automatische Spracherkennung** | Sendet `source=auto` und zeigt die erkannte Sprache beim Ausgangstext an |
| 🧩 | **Übersetzungsvarianten** | Fordert bis zu fünf Alternativen an, die sich unter dem Ergebnis auswählen lassen |
| ⚡ | **Live-Übersetzung** | Übersetzt auf Wunsch nach einer kurzen Eingabepause |
| 🔀 | **Sprachen tauschen** | Tauscht Sprachcodes und Text per Klick |
| 🔁 | **Tastenkürzel** | Startet die Übersetzung mit `Ctrl+Enter` oder `Cmd+Enter` |
| 📋 | **Ergebnis kopieren** | Kopiert die Übersetzung in die Zwischenablage und zeigt kurz eine Bestätigung an |
| 🔊 | **Vorlesen** | Der Browser liest die Übersetzung mit `speechSynthesis` vor |
| 🔢 | **Zeichenlimit** | Liest `charLimit` der Instanz und blockiert zu lange Anfragen |
| 🔑 | **Optionaler API-Schlüssel** | Wird in `localStorage` gespeichert und an die gewählte Instanz gesendet |
| 🖼️ | **Freie Serverwahl** | Unterstützt Community-Server und selbst betriebene LibreTranslate-Instanzen |
| 🤖 | **LLM-Modus** | Übersetzt mit eigenem API-Schlüssel über OpenAI, Anthropic, Groq, OpenRouter oder einen OpenAI-kompatiblen Endpunkt |
| 🌗 | **Dunkles und helles Design** | Die Einstellung im GitHub-Stil bleibt beim nächsten Besuch erhalten |

---

## Technik

| Bereich | Werkzeug | Aufgabe |
|---|---|---|
| Sprache | TypeScript 5.3 | Strenge Typisierung der API-Antworten |
| Build | Vite 5 | TypeScript-Verarbeitung und Entwicklungsserver |
| Übersetzung | LibreTranslate-API | Quelloffene Schnittstelle mit CORS-Unterstützung |
| Hosting | GitHub Pages | Kostenloses Hosting statischer Dateien und Veröffentlichung per Befehl |

---

## So funktioniert es

```

Browser (GitHub Pages)
        │
        ▼
   GET /languages          → füllt beide Sprachauswahllisten
   GET /frontend/settings  → charLimit, keyRequired
        │
        ▼
   POST /translate {q, source, target, alternatives?, api_key?}
        │
        ▼
   translatedText → Übersetzungsfeld
   alternatives[] → auswählbare Varianten unter dem Ergebnis
   detectedLanguage → Anzeige der erkannten Sprache
```

Der Browser sendet die Anfragen direkt an die LibreTranslate-Instanz. Der Server konfiguriert CORS, etwa mit dem Header `Access-Control-Allow-Origin: *`, sodass die App keinen Proxy benötigt

Die Standardadresse ist `https://translate.libregalaxy.org`, ein Community-Server ohne API-Schlüssel oder Zeichenlimit. Wenn deine Instanz einen Schlüssel verlangt, trage ihn unter **Settings** ein. Der Browser speichert ihn in `localStorage` und sendet ihn bei Übersetzungsanfragen als `api_key`

### LLM-Modus

Wähle unter **Settings → Engine → LLM** einen Anbieter aus, etwa OpenAI, Anthropic, Groq, OpenRouter oder einen lokalen OpenAI-kompatiblen Server. Gib deinen API-Schlüssel und das gewünschte Modell an. Die App ruft `/chat/completions` oder `/v1/messages` auf und erwartet die Übersetzung, mögliche Varianten und die erkannte Sprache als JSON. Die Einstellungen bleiben in `localStorage`, der Schlüssel wird an die konfigurierte API-Adresse gesendet und der Anbieter rechnet die Anfragen über deinen Schlüssel ab

Mit **Explain meaning** erhältst du eine natürliche Übersetzung und eine Erklärung von Wortspielen, Redewendungen, Witzen oder kulturellen Anspielungen in der Zielsprache. Wenn sich eine ähnliche Wirkung erzielen lässt, schlägt die App eine passende Fassung vor. Die Schaltfläche sendet eine eigene Anfrage an den eingestellten Anbieter

Markiere vor dem Klick auf **Explain meaning** eine Wendung im Ausgangstext, um nur diese Wendung erklären zu lassen. Der übrige Text wird als Kontext an den Anbieter gesendet

---

## Erste Schritte

```bash
git clone https://github.com/jarryuser/kindalibre-translate.git
cd kindalibre-translate
npm install

npm run dev    # → http://localhost:5173
```

---

## Veröffentlichung

```bash
npm run deploy
```

Der Befehl erstellt den Build und veröffentlicht `dist/` mit der Datei `.nojekyll` im Branch `gh-pages`. Er wartet bis zu fünf Minuten darauf, dass die veröffentlichte Startseite auf die neue JavaScript-Datei verweist und die Datei abrufbar ist. Andernfalls endet der Befehl mit einem Fehler

Passe bei einem Fork `base` in `vite.config.ts` an den Pfad auf GitHub Pages an und setze `SITE_URL` entsprechend

---

## Projektstruktur

```
kindalibre-translate/
├── index.html                 - zentrale HTML-Datei
├── public/ - statische Dateien
│   └── .nojekyll              - deaktiviert Jekyll auf GitHub Pages
├── scripts/ - Skripte
│   └── deploy.mjs             - Veröffentlichung und Kontrolle der Live-Version
├── src/ - Quellcode
│   ├── api.ts                 - LibreTranslate-Client und Speicherung von Übersetzungsdienst und Schlüsseln
│   ├── llm.ts                 - LLM-Client und Anbietervorgaben
│   ├── languages.ts           - Sprachliste für den LLM-Modus
│   ├── main.ts                - Oberflächenzustand, Übersetzungsablauf und Tastenkürzel
│   └── style.css              - dunkles und helles Design im GitHub-Stil
├── vite.config.ts             - Basispfad für GitHub Pages
└── tsconfig.json
```

---

## Bekannte Einschränkungen

- **Verfügbarkeit von Community-Servern** - für den Standardserver gibt es keine Verfügbarkeitsgarantie. Wähle bei einem Ausfall unter **Settings** eine andere Instanz
- **Kostenpflichtige offizielle Instanz** - `libretranslate.com` verlangt einen Schlüssel von `portal.libretranslate.com`. LibreTranslate lässt sich ohne Lizenzgebühr selbst betreiben
- **Grenzen des LLM-Modus** - Qualität, Kosten und Tokenlimits hängen vom Anbieter und vom Modell ab
- **Zeichenlimit** - ein positiver Wert für `charLimit` wird vor dem Versand geprüft. Im LLM-Modus begrenzt die App die Zeichenanzahl nicht
- **Vorlesen** - verfügbare Stimmen und Sprachen hängen vom Browser und Betriebssystem ab

---

## Mitwirken

Fehlermeldungen und Pull Requests sind willkommen. Wenn du einen Fehler findest oder eine Funktion vorschlagen möchtest, eröffne zuerst ein Issue, damit wir darüber sprechen können

---

## Lizenz

MIT © [Dmytro Filiurskyi](https://github.com/jarryuser)
