import { AUTO_CODE, DEFAULT_INSTANCE, fetchLanguages, fetchSettings, getApiKey, getApiUrl, saveApiKey, saveApiUrl, translate, type Language, type TranslateResult } from './api.js';

const sourceSelect = document.getElementById('source-lang') as HTMLSelectElement;
const targetSelect = document.getElementById('target-lang') as HTMLSelectElement;
const sourceText = document.getElementById('source-text') as HTMLTextAreaElement;
const targetText = document.getElementById('target-text') as HTMLTextAreaElement;
const alternativesEl = document.getElementById('alternatives') as HTMLElement;
const alternativesCountEl = document.getElementById('alternatives-count') as HTMLSelectElement;
const translateBtn = document.getElementById('translate-btn') as HTMLButtonElement;
const swapBtn = document.getElementById('swap-btn') as HTMLButtonElement;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
const speakBtn = document.getElementById('speak-btn') as HTMLButtonElement;
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
const liveToggle = document.getElementById('live-toggle') as HTMLInputElement;
const detectedBadge = document.getElementById('detected-lang') as HTMLElement;
const statusBadge = document.getElementById('status-badge') as HTMLElement;
const errorMsg = document.getElementById('error-msg') as HTMLElement;
const charCount = document.getElementById('char-count') as HTMLElement;
const charLimitEl = document.getElementById('char-limit') as HTMLElement;
const instanceInfo = document.getElementById('instance-info') as HTMLElement;
const keyInfo = document.getElementById('key-info') as HTMLElement;
const themeBtn = document.getElementById('theme-btn') as HTMLButtonElement;
const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
const apiUrlInput = document.getElementById('api-url') as HTMLInputElement;
const saveSettingsBtn = document.getElementById('save-settings-btn') as HTMLButtonElement;
const resetSettingsBtn = document.getElementById('reset-settings-btn') as HTMLButtonElement;
const settingsStatus = document.getElementById('settings-status') as HTMLElement;

const SOURCE_STORAGE = 'libretranslate:source';
const TARGET_STORAGE = 'libretranslate:target';
const LIVE_STORAGE = 'libretranslate:live';
const THEME_STORAGE = 'libretranslate:theme';
const ALT_STORAGE = 'libretranslate:alternatives';
const DEFAULT_TARGET = 'en';

let languages: Language[] = [];
let charLimit = 2000;
let lastRequestId = 0;
let altOptions: string[] = [];
let selectedAlt = 0;
let alternativesCount = 3;

function langName(code: string): string {
  if (code === AUTO_CODE) return 'Auto detect';
  return languages.find((l) => l.code === code)?.name ?? code;
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function setStatus(state: 'idle' | 'busy' | 'done' | 'error', text: string): void {
  statusBadge.className = `status-badge${state === 'busy' ? ' busy' : ''}${state === 'error' ? ' error' : ''}`;
  statusBadge.textContent = text;
}

function setError(text: string): void {
  errorMsg.textContent = text;
}

function renderAlternatives(): void {
  if (altOptions.length === 0) {
    alternativesEl.hidden = true;
    alternativesEl.innerHTML = '';
    return;
  }
  alternativesEl.hidden = false;
  alternativesEl.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'alt-title';
  title.textContent = 'Alternatives';
  alternativesEl.appendChild(title);
  altOptions.forEach((alt, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `alt-option${i === selectedAlt ? ' selected' : ''}`;
    btn.textContent = alt;
    btn.addEventListener('click', () => {
      targetText.value = alt;
      selectedAlt = i;
      alternativesEl.querySelectorAll('.alt-option').forEach((el, j) => {
        el.classList.toggle('selected', j === i);
      });
    });
    alternativesEl.appendChild(btn);
  });
}

function applyResult(result: TranslateResult): void {
  targetText.value = result.translatedText;
  altOptions = result.alternatives ?? [];
  selectedAlt = 0;
  if (result.detectedLanguage) {
    detectedBadge.textContent = langName(result.detectedLanguage.language);
  }
  renderAlternatives();
  setStatus('done', 'Done');
}

function updateCharCounter(): void {
  const len = sourceText.value.length;
  charCount.textContent = String(len);
  const limited = Number.isFinite(charLimit);
  charLimitEl.textContent = limited ? `/${charLimit}` : '/∞';
  charLimitEl.classList.toggle('limit-near', limited && len > charLimit * 0.8 && len <= charLimit);
  charLimitEl.classList.toggle('limit-over', len > charLimit);
  translateBtn.disabled = len === 0 || len > charLimit;
}

function saveSelection(): void {
  localStorage.setItem(SOURCE_STORAGE, sourceSelect.value);
  localStorage.setItem(TARGET_STORAGE, targetSelect.value);
}

function populateSelects(): void {
  sourceSelect.innerHTML = '';
  targetSelect.innerHTML = '';
  const auto = document.createElement('option');
  auto.value = AUTO_CODE;
  auto.textContent = 'Auto detect';
  sourceSelect.appendChild(auto);
  for (const lang of languages) {
    const opt = document.createElement('option');
    opt.value = lang.code;
    opt.textContent = lang.name;
    sourceSelect.appendChild(opt);
    targetSelect.appendChild(opt.cloneNode(true));
  }
  const source = localStorage.getItem(SOURCE_STORAGE) ?? AUTO_CODE;
  const target = localStorage.getItem(TARGET_STORAGE) ?? DEFAULT_TARGET;
  if (languages.some((l) => l.code === source)) sourceSelect.value = source;
  if (languages.some((l) => l.code === target)) targetSelect.value = target;
}

function renderFooter(): void {
  const url = getApiUrl();
  instanceInfo.textContent = hostOf(url);
  keyInfo.textContent = getApiKey() ? 'API key set' : 'No API key';
}

async function loadLanguages(): Promise<void> {
  const url = getApiUrl();
  try {
    languages = await fetchLanguages(url);
    populateSelects();
    setError('');
  } catch (err) {
    languages = [];
    setError(`Failed to load languages from ${url}: ${err instanceof Error ? err.message : err}`);
    setStatus('error', 'Offline');
  }
}

async function loadSettings(): Promise<void> {
  const settings = await fetchSettings(getApiUrl());
  if (settings) {
    charLimit = settings.charLimit > 0 ? settings.charLimit : Infinity;
    if (settings.keyRequired && !getApiKey()) {
      setError('This instance requires an API key. Add one in Settings.');
    }
  }
  updateCharCounter();
}

async function doTranslate(): Promise<void> {
  const text = sourceText.value.trim();
  const source = sourceSelect.value;
  const target = targetSelect.value;
  if (!text) {
    targetText.value = '';
    altOptions = [];
    selectedAlt = 0;
    detectedBadge.textContent = '';
    setStatus('idle', 'Idle');
    setError('');
    renderAlternatives();
    return;
  }
  if (text.length > charLimit) return;
  if (source === target && source !== AUTO_CODE) {
    setError('Source and target languages are the same.');
    return;
  }

  const reqId = ++lastRequestId;
  setStatus('busy', 'Translating…');
  setError('');
  try {
    const result = await translate(getApiUrl(), getApiKey(), {
      q: text,
      source,
      target,
      alternatives: alternativesCount,
    });
    if (reqId !== lastRequestId) return;
    applyResult(result);
  } catch (err) {
    if (reqId !== lastRequestId) return;
    if (alternativesCount > 0 && err instanceof Error && /alternatives/i.test(err.message)) {
      try {
        const result = await translate(getApiUrl(), getApiKey(), { q: text, source, target });
        if (reqId !== lastRequestId) return;
        applyResult(result);
        return;
      } catch {
        if (reqId !== lastRequestId) return;
      }
    }
    altOptions = [];
    selectedAlt = 0;
    renderAlternatives();
    setStatus('error', 'Error');
    setError(err instanceof Error ? err.message : String(err));
  }
}

function swapLanguages(): void {
  const src = sourceSelect.value;
  const tgt = targetSelect.value;
  sourceSelect.value = tgt === AUTO_CODE ? src : tgt;
  targetSelect.value = src === AUTO_CODE ? DEFAULT_TARGET : src;
  sourceText.value = targetText.value;
  targetText.value = '';
  altOptions = [];
  selectedAlt = 0;
  renderAlternatives();
  detectedBadge.textContent = '';
  saveSelection();
  updateCharCounter();
  doTranslate();
}

async function copyResult(): Promise<void> {
  if (!targetText.value) return;
  try {
    await navigator.clipboard.writeText(targetText.value);
    copyBtn.textContent = 'Copied';
    setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
  } catch {
    setError('Could not access the clipboard.');
  }
}

function speakResult(): void {
  if (!targetText.value) return;
  const utterance = new SpeechSynthesisUtterance(targetText.value);
  const voice = speechSynthesis.getVoices().find((v) => v.lang === targetSelect.value);
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

function toggleTheme(): void {
  const html = document.documentElement;
  const next = html.dataset.theme === 'light' ? 'dark' : 'light';
  html.dataset.theme = next;
  themeBtn.textContent = next === 'dark' ? '☀' : '☾';
  localStorage.setItem(THEME_STORAGE, next);
}

function applyTheme(): void {
  const theme = localStorage.getItem(THEME_STORAGE) ?? 'dark';
  document.documentElement.dataset.theme = theme;
  themeBtn.textContent = theme === 'dark' ? '☀' : '☾';
}

async function saveSettings(): Promise<void> {
  saveApiKey(apiKeyInput.value);
  saveApiUrl(apiUrlInput.value);
  settingsStatus.textContent = 'Saving…';
  settingsStatus.className = 'settings-status';
  renderFooter();
  await Promise.all([loadLanguages(), loadSettings()]);
  settingsStatus.textContent = 'Saved';
  setTimeout(() => (settingsStatus.textContent = ''), 1800);
}

function resetSettings(): void {
  apiKeyInput.value = '';
  apiUrlInput.value = DEFAULT_INSTANCE;
  localStorage.removeItem('libretranslate:key');
  localStorage.removeItem('libretranslate:url');
  saveSettings();
}

function init(): void {
  applyTheme();
  apiKeyInput.value = getApiKey();
  apiUrlInput.value = getApiUrl();
  liveToggle.checked = localStorage.getItem(LIVE_STORAGE) !== 'off';
  const savedAlt = Number(localStorage.getItem(ALT_STORAGE));
  alternativesCount =
    localStorage.getItem(ALT_STORAGE) !== null && Number.isInteger(savedAlt) && savedAlt >= 0 && savedAlt <= 5
      ? savedAlt
      : 3;
  alternativesCountEl.value = String(alternativesCount);
  renderFooter();
  updateCharCounter();
  renderAlternatives();

  translateBtn.addEventListener('click', () => doTranslate());
  swapBtn.addEventListener('click', swapLanguages);
  copyBtn.addEventListener('click', copyResult);
  speakBtn.addEventListener('click', speakResult);
  clearBtn.addEventListener('click', () => {
    sourceText.value = '';
    targetText.value = '';
    altOptions = [];
    selectedAlt = 0;
    renderAlternatives();
    detectedBadge.textContent = '';
    setStatus('idle', 'Idle');
    setError('');
    updateCharCounter();
    sourceText.focus();
  });
  themeBtn.addEventListener('click', toggleTheme);
  saveSettingsBtn.addEventListener('click', saveSettings);
  resetSettingsBtn.addEventListener('click', resetSettings);
  alternativesCountEl.addEventListener('change', () => {
    alternativesCount = Number(alternativesCountEl.value);
    localStorage.setItem(ALT_STORAGE, alternativesCountEl.value);
  });

  sourceText.addEventListener('input', updateCharCounter);
  sourceSelect.addEventListener('change', () => {
    if (targetSelect.value === sourceSelect.value && sourceSelect.value !== AUTO_CODE) {
      const fallback = languages.find((l) => l.code !== sourceSelect.value);
      targetSelect.value = fallback ? fallback.code : DEFAULT_TARGET;
    }
    detectedBadge.textContent = '';
    saveSelection();
    if (liveToggle.checked) doTranslate();
  });
  targetSelect.addEventListener('change', () => {
    saveSelection();
    if (liveToggle.checked) doTranslate();
  });

  sourceText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      doTranslate();
    }
  });

  let debounceTimer: number | undefined;
  liveToggle.addEventListener('change', () => {
    localStorage.setItem(LIVE_STORAGE, liveToggle.checked ? 'on' : 'off');
    if (liveToggle.checked) doTranslate();
  });
  sourceText.addEventListener('input', () => {
    if (!liveToggle.checked) return;
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => doTranslate(), 600);
  });

  if (!('speechSynthesis' in window)) {
    speakBtn.style.display = 'none';
  }

  loadSettings().then(() => loadLanguages());
}

init();