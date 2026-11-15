<div align="center">

# Kindalibre Translate

**Браузерный переводчик на основе API LibreTranslate, без собственного сервера и с публикацией на GitHub Pages одной командой**

[English](./README.md) · [Slovenčina](./README.sk.md) · [Deutsch](./README.de.md) · [Українська](./README.uk.md) · **Русский**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-→-2f81f7?style=flat-square)](https://jarryuser.github.io/kindalibre-translate/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![LibreTranslate](https://img.shields.io/badge/Powered%20by-LibreTranslate-2f81f7?style=flat-square)](https://libretranslate.com/)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-222?style=flat-square&logo=github)](https://pages.github.com/)

</div>

---

## Обзор

Kindalibre Translate вызывает **API LibreTranslate** напрямую из браузера. Приложение состоит из нескольких статических файлов и не требует собственного сервера, базы данных или секретов при сборке

Введите или вставьте текст, выберите язык перевода и нажмите **Translate**. Приложение поддерживает автоматическое определение языка, перевод при вводе, смену направления перевода, копирование, озвучивание и более 50 языков из списка LibreTranslate

По умолчанию приложение использует `translate.libregalaxy.org`, бесплатный сервер сообщества без обязательного ключа API. В разделе **Settings** можно указать другой сервер LibreTranslate с поддержкой CORS, в том числе официальный платный `libretranslate.com` или свой сервер

**Попробовать:** [jarryuser.github.io/kindalibre-translate](https://jarryuser.github.io/kindalibre-translate/)

---

## Возможности

| | Возможность | Подробности |
|---|---|---|
| 🌐 | **Более 50 языков** | LibreTranslate отдаёт список языков через `/languages` |
| 🔍 | **Автоопределение языка** | Отправляет `source=auto` и показывает распознанный язык рядом с исходным текстом |
| 🧩 | **Варианты перевода** | Запрашивает до пяти вариантов, которые можно выбрать под результатом |
| ⚡ | **Перевод при вводе** | Включаемый режим переводит после короткой паузы в наборе текста |
| 🔀 | **Смена направления** | Меняет местами коды языков и текст одним нажатием |
| 🔁 | **Сочетание клавиш** | Запускает перевод по `Ctrl+Enter` или `Cmd+Enter` |
| 📋 | **Копирование результата** | Копирует перевод в буфер обмена и ненадолго показывает подтверждение |
| 🔊 | **Озвучивание** | Браузер читает перевод вслух через `speechSynthesis` |
| 🔢 | **Ограничение длины** | Получает `charLimit` от сервера и блокирует слишком длинные запросы |
| 🔑 | **Необязательный ключ API** | Хранится в `localStorage` и отправляется выбранному серверу |
| 🖼️ | **Выбор сервера** | Поддерживает серверы сообщества и собственные инсталляции LibreTranslate |
| 🤖 | **Режим LLM** | Перевод через OpenAI, Anthropic, Groq, OpenRouter или OpenAI-совместимый сервер с собственным ключом API |
| 🌗 | **Тёмная и светлая темы** | Тема в стиле GitHub сохраняется между посещениями |

---

## Технологии

| Уровень | Инструмент | Назначение |
|---|---|---|
| Язык | TypeScript 5.3 | Строгая типизация ответов API |
| Сборка | Vite 5 | Обработка TypeScript и сервер разработки |
| Перевод | LibreTranslate API | Открытый исходный код и поддержка CORS |
| Хостинг | GitHub Pages | Бесплатный статический хостинг и публикация одной командой |

---

## Как это работает

```

Браузер (GitHub Pages)
        │
        ▼
   GET /languages          → заполняет оба списка языков
   GET /frontend/settings  → charLimit, keyRequired
        │
        ▼
   POST /translate {q, source, target, alternatives?, api_key?}
        │
        ▼
   translatedText → поле перевода
   alternatives[] → варианты под результатом
   detectedLanguage → метка с определённым языком
```

Браузер отправляет запросы непосредственно серверу LibreTranslate. Сервер настраивает CORS, например с помощью заголовка `Access-Control-Allow-Origin: *`, поэтому приложению не нужен прокси

Адрес по умолчанию `https://translate.libregalaxy.org` ведёт на сервер сообщества без обязательного ключа API и ограничения числа символов. Если выбранный сервер требует ключ, введите его в разделе **Settings**. Браузер сохранит его в `localStorage` и будет передавать в запросах на перевод как `api_key`

### Режим LLM

В меню **Settings → Engine → LLM** выберите провайдера, например OpenAI, Anthropic, Groq, OpenRouter или локальный OpenAI-совместимый сервер. Введите свой ключ API и выберите модель. Приложение вызывает `/chat/completions` или `/v1/messages` и ожидает перевод, возможные варианты и распознанный язык в формате JSON. Настройки хранятся в `localStorage`, ключ отправляется по указанному адресу API, а запросы оплачиваются по условиям провайдера

---

## Начало работы

```bash
git clone https://github.com/jarryuser/kindalibre-translate.git
cd kindalibre-translate
npm install

npm run dev    # → http://localhost:5173
```

---

## Публикация

```bash
npm run deploy
```

Команда собирает приложение и публикует содержимое `dist/` с файлом `.nojekyll` в ветке `gh-pages`. Она ждёт до пяти минут, пока главная страница начнёт ссылаться на новый JavaScript-файл и сам файл станет доступен. В противном случае команда завершается с ошибкой

Для форка настройте `base` в `vite.config.ts` по пути на GitHub Pages и задайте `SITE_URL`

---

## Структура проекта

```
kindalibre-translate/
├── index.html                 - главный HTML-файл
├── public/ - статические файлы
│   └── .nojekyll              - отключает обработку Jekyll на GitHub Pages
├── scripts/ - скрипты
│   └── deploy.mjs             - публикация и проверка развёртывания
├── src/ - исходный код
│   ├── api.ts                 - клиент LibreTranslate и хранение ключей и выбора движка
│   ├── llm.ts                 - клиент LLM и настройки провайдеров
│   ├── languages.ts           - список языков для режима LLM
│   ├── main.ts                - состояние интерфейса, ход перевода и сочетания клавиш
│   └── style.css              - тёмная и светлая темы в стиле GitHub
├── vite.config.ts             - базовый путь для GitHub Pages
└── tsconfig.json
```

---

## Известные ограничения

- **Доступность серверов сообщества** - доступность сервера по умолчанию не гарантируется. Если он перестал отвечать, выберите другой сервер в разделе **Settings**
- **Официальный сервер платный** - `libretranslate.com` требует ключ с `portal.libretranslate.com`. LibreTranslate можно запустить на своём сервере без лицензионной платы
- **Ограничения режима LLM** - качество, стоимость и лимиты токенов зависят от провайдера и модели
- **Ограничение длины** - положительный `charLimit` проверяется перед отправкой запроса. В режиме LLM приложение не ограничивает число символов
- **Озвучивание** - доступные голоса и языки зависят от браузера и операционной системы

---

## Как помочь проекту

Сообщения о проблемах и pull request приветствуются. Если нашли ошибку или хотите предложить новую возможность, сначала откройте issue для обсуждения

---

## Лицензия

MIT © [Dmytro Filiurskyi](https://github.com/jarryuser)
