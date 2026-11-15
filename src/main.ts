import { AUTO_CODE, DEFAULT_INSTANCE, fetchLanguages, fetchSettings, getApiKey, getApiUrl, getEngine, getLlmConfig, saveApiKey, saveApiUrl, saveEngine, saveLlmConfig, translate, type Engine, type Language, type TranslateResult } from './api.js';
import { explainWithLLM, LLM_PROVIDERS, translateWithLLM } from './llm.js';
import { STATIC_LANGUAGES } from './languages.js';

const sourceSelect = document.getElementById('source-lang') as HTMLSelectElement;
const targetSelect = document.getElementById('target-lang') as HTMLSelectElement;
const sourceText = document.getElementById('source-text') as HTMLTextAreaElement;
const targetText = document.getElementById('target-text') as HTMLTextAreaElement;
const alternativesEl = document.getElementById('alternatives') as HTMLElement;
const alternativesCountEl = document.getElementById('alternatives-count') as HTMLSelectElement;
const translateBtn = document.getElementById('translate-btn') as HTMLButtonElement;
const swapBtn = document.getElementById('swap-btn') as HTMLButtonElement;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
const explainBtn = document.getElementById('explain-btn') as HTMLButtonElement;
const explanationStatus = document.getElementById('explanation-status') as HTMLElement;
const explanationResult = document.getElementById('explanation-result') as HTMLElement;
const explanationExcerpt = document.getElementById('explanation-excerpt') as HTMLElement;
const explainedExcerpt = document.getElementById('explained-excerpt') as HTMLElement;
const explainedTranslation = document.getElementById('explained-translation') as HTMLElement;
const explainedMeaning = document.getElementById('explained-meaning') as HTMLElement;
const adaptationEl = document.getElementById('adaptation') as HTMLElement;
const explainedAdaptation = document.getElementById('explained-adaptation') as HTMLElement;
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
const engineSelect = document.getElementById('engine') as HTMLSelectElement;
const ltSettingsEl = document.getElementById('lt-settings') as HTMLElement;
const llmSettingsEl = document.getElementById('llm-settings') as HTMLElement;
const llmProviderSelect = document.getElementById('llm-provider') as HTMLSelectElement;
const llmKeyInput = document.getElementById('llm-key') as HTMLInputElement;
const llmBaseInput = document.getElementById('llm-base') as HTMLInputElement;
const llmModelInput = document.getElementById('llm-model') as HTMLInputElement;

const SOURCE_STORAGE = 'kindalibre:source';
const TARGET_STORAGE = 'kindalibre:target';
const LIVE_STORAGE = 'kindalibre:live';
const THEME_STORAGE = 'kindalibre:theme';
const ALT_STORAGE = 'kindalibre:alternatives';
const DEFAULT_TARGET = 'en';

let languages: Language[] = [];
let charLimit = 2000;
let lastRequestId = 0;
let altOptions: string[] = [];
let alternativesCount = 3;
let engine: Engine = getEngine();
let explanationRequest: AbortController | undefined;

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

function updateExplainButton(): void {
  explainBtn.disabled = Boolean(explanationRequest) || explainBtn.hidden || !sourceText.value.trim()
    || !sourceSelect.value || !targetSelect.value || sourceSelect.value === targetSelect.value;
}

function setExplanationStatus(message: string, error = false): void {
  explanationStatus.classList.toggle('error', error);
  explanationStatus.textContent = message;
}

function resetExplanation(): void {
  explanationRequest?.abort();
  explanationRequest = undefined;
  explanationResult.hidden = true;
  setExplanationStatus('');
  updateExplainButton();
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
  altOptions.forEach((alt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'alt-option';
    btn.textContent = alt;
    btn.addEventListener('click', () => {
      targetText.value = alt;
      alternativesEl.querySelectorAll('.alt-option').forEach((el) => {
        el.classList.toggle('selected', el === btn);
      });
    });
    alternativesEl.appendChild(btn);
  });
}

function applyResult(result: TranslateResult): void {
  targetText.value = result.translatedText;
  altOptions = result.alternatives ?? [];
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
  const list = engine === 'llm' ? STATIC_LANGUAGES : languages;
  sourceSelect.innerHTML = '';
  targetSelect.innerHTML = '';
  const auto = document.createElement('option');
  auto.value = AUTO_CODE;
  auto.textContent = 'Auto detect';
  sourceSelect.appendChild(auto);
  for (const lang of list) {
    const opt = document.createElement('option');
    opt.value = lang.code;
    opt.textContent = lang.name;
    sourceSelect.appendChild(opt);
    targetSelect.appendChild(opt.cloneNode(true));
  }
  const source = localStorage.getItem(SOURCE_STORAGE) ?? AUTO_CODE;
  const target = localStorage.getItem(TARGET_STORAGE) ?? DEFAULT_TARGET;
  if (list.some((l) => l.code === source)) sourceSelect.value = source;
  if (list.some((l) => l.code === target)) targetSelect.value = target;
  updateExplainButton();
}

function renderFooter(): void {
  if (engine === 'llm') {
    const cfg = getLlmConfig();
    const provider = LLM_PROVIDERS[cfg.provider] ?? LLM_PROVIDERS.custom;
    instanceInfo.textContent = provider.name;
    keyInfo.textContent = cfg.apiKey ? `LLM key set (${cfg.model || provider.defaultModel})` : 'No LLM key';
    return;
  }
  const url = getApiUrl();
  instanceInfo.textContent = hostOf(url);
  keyInfo.textContent = getApiKey() ? 'API key set' : 'No API key';
}

async function loadLanguages(): Promise<void> {
  if (engine === 'llm') {
    languages = [];
    populateSelects();
    setError('');
    return;
  }
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
  if (engine === 'llm') {
    charLimit = Infinity;
    updateCharCounter();
    return;
  }
  const settings = await fetchSettings(getApiUrl());
  if (settings) {
    charLimit = settings.charLimit > 0 ? settings.charLimit : Infinity;
    if (settings.keyRequired && !getApiKey()) {
      setError('This instance requires an API key. Add one in Settings.');
    }
  }
  updateCharCounter();
}

function selectedOptionText(select: HTMLSelectElement): string {
  return select.options[select.selectedIndex]?.text ?? select.value;
}

async function explainMeaning(): Promise<void> {
  if (explainBtn.disabled) return;

  const { value, selectionStart, selectionEnd } = sourceText;
  const selectedText = value.slice(selectionStart, selectionEnd).trim();
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  const context = selectedText && (before.trim() || after.trim()) ? { before, after } : undefined;
  const source = sourceSelect.value;
  const target = targetSelect.value;
  const request = new AbortController();
  explanationRequest = request;
  explanationResult.hidden = true;
  updateExplainButton();
  setExplanationStatus('Explaining…');
  try {
    const result = await explainWithLLM(getLlmConfig(), {
      q: context ? selectedText : value.trim(),
      context,
      source,
      sourceName: selectedOptionText(sourceSelect),
      targetName: selectedOptionText(targetSelect),
    }, request.signal);
    if (request.signal.aborted) return;

    explanationExcerpt.hidden = !context;
    explainedExcerpt.lang = source === AUTO_CODE ? '' : source;
    explainedExcerpt.textContent = context ? selectedText : '';
    explainedTranslation.lang = explainedMeaning.lang = explainedAdaptation.lang = target;
    explainedTranslation.textContent = result.translatedText;
    explainedMeaning.textContent = result.explanation;
    explainedAdaptation.textContent = result.adaptation ?? '';
    adaptationEl.hidden = !result.adaptation;
    explanationResult.hidden = false;
    setExplanationStatus('');
  } catch (err) {
    if (!request.signal.aborted) setExplanationStatus(err instanceof Error ? err.message : String(err), true);
  } finally {
    if (explanationRequest === request) {
      explanationRequest = undefined;
      updateExplainButton();
    }
  }
}

function runTranslate(text: string, source: string, target: string, alternatives: number): Promise<TranslateResult> {
  if (engine === 'llm') {
    return translateWithLLM(getLlmConfig(), {
      q: text,
      source,
      sourceName: source === AUTO_CODE ? 'auto-detect' : selectedOptionText(sourceSelect),
      targetName: selectedOptionText(targetSelect),
      alternatives,
    });
  }
  return translate(getApiUrl(), getApiKey(), { q: text, source, target, alternatives });
}

async function doTranslate(): Promise<void> {
  const text = sourceText.value.trim();
  const source = sourceSelect.value;
  const target = targetSelect.value;
  if (!text) {
    lastRequestId++;
    targetText.value = '';
    altOptions = [];
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
    const result = await runTranslate(text, source, target, alternativesCount);
    if (reqId !== lastRequestId) return;
    applyResult(result);
  } catch (err) {
    if (reqId !== lastRequestId) return;
    if (alternativesCount > 0 && err instanceof Error && /alternatives/i.test(err.message)) {
      try {
        const result = await runTranslate(text, source, target, 0);
        if (reqId !== lastRequestId) return;
        applyResult(result);
        return;
      } catch {
        if (reqId !== lastRequestId) return;
      }
    }
    altOptions = [];
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
  resetExplanation();
  altOptions = [];
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

function applyEngineVisibility(): void {
  const llm = engine === 'llm';
  ltSettingsEl.hidden = llm;
  llmSettingsEl.hidden = !llm;
  explainBtn.hidden = !llm;
  resetExplanation();
}

function fillLlmProviders(): void {
  llmProviderSelect.innerHTML = '';
  for (const [key, provider] of Object.entries(LLM_PROVIDERS)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = provider.name;
    llmProviderSelect.appendChild(opt);
  }
}

function applyLlmPreset(): void {
  const provider = LLM_PROVIDERS[llmProviderSelect.value];
  if (provider) {
    llmBaseInput.value = provider.baseUrl;
    llmModelInput.value = provider.defaultModel;
  }
}

async function saveSettings(): Promise<void> {
  engine = engineSelect.value === 'llm' ? 'llm' : 'libretranslate';
  saveEngine(engine);
  saveApiKey(apiKeyInput.value);
  saveApiUrl(apiUrlInput.value);
  saveLlmConfig({
    provider: llmProviderSelect.value,
    apiKey: llmKeyInput.value,
    baseUrl: llmBaseInput.value,
    model: llmModelInput.value,
  });
  settingsStatus.textContent = 'Saving…';
  settingsStatus.className = 'settings-status';
  applyEngineVisibility();
  renderFooter();
  await Promise.all([loadLanguages(), loadSettings()]);
  settingsStatus.textContent = 'Saved';
  setTimeout(() => (settingsStatus.textContent = ''), 1800);
}

function resetSettings(): void {
  engine = 'libretranslate';
  engineSelect.value = 'libretranslate';
  apiKeyInput.value = '';
  apiUrlInput.value = DEFAULT_INSTANCE;
  llmProviderSelect.value = 'openai';
  llmKeyInput.value = '';
  applyLlmPreset();
  saveEngine(engine);
  localStorage.removeItem('kindalibre:key');
  localStorage.removeItem('kindalibre:url');
  localStorage.removeItem('kindalibre:engine');
  localStorage.removeItem('kindalibre:llm:provider');
  localStorage.removeItem('kindalibre:llm:key');
  localStorage.removeItem('kindalibre:llm:base');
  localStorage.removeItem('kindalibre:llm:model');
  saveSettings();
}

function init(): void {
  applyTheme();
  engineSelect.value = engine;
  fillLlmProviders();
  const cfg = getLlmConfig();
  llmProviderSelect.value = cfg.provider;
  llmKeyInput.value = cfg.apiKey;
  const presets = LLM_PROVIDERS[cfg.provider] ?? LLM_PROVIDERS.custom;
  llmBaseInput.value = cfg.baseUrl || presets.baseUrl;
  llmModelInput.value = cfg.model || presets.defaultModel;
  applyEngineVisibility();
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

  let debounceTimer: number | undefined;
  translateBtn.addEventListener('click', () => doTranslate());
  swapBtn.addEventListener('click', swapLanguages);
  copyBtn.addEventListener('click', copyResult);
  explainBtn.addEventListener('click', explainMeaning);
  speakBtn.addEventListener('click', speakResult);
  clearBtn.addEventListener('click', () => {
    window.clearTimeout(debounceTimer);
    sourceText.value = '';
    resetExplanation();
    doTranslate();
    updateCharCounter();
    sourceText.focus();
  });
  themeBtn.addEventListener('click', toggleTheme);
  engineSelect.addEventListener('change', () => {
    engine = engineSelect.value === 'llm' ? 'llm' : 'libretranslate';
    saveEngine(engine);
    applyEngineVisibility();
    renderFooter();
    loadLanguages().then(loadSettings);
  });
  llmProviderSelect.addEventListener('change', applyLlmPreset);
  saveSettingsBtn.addEventListener('click', saveSettings);
  resetSettingsBtn.addEventListener('click', resetSettings);
  alternativesCountEl.addEventListener('change', () => {
    alternativesCount = Number(alternativesCountEl.value);
    localStorage.setItem(ALT_STORAGE, alternativesCountEl.value);
  });

  sourceSelect.addEventListener('change', () => {
    if (targetSelect.value === sourceSelect.value && sourceSelect.value !== AUTO_CODE) {
      const fallback = Array.from(targetSelect.options).find((o) => o.value !== sourceSelect.value && o.value !== AUTO_CODE);
      targetSelect.value = fallback ? fallback.value : DEFAULT_TARGET;
    }
    resetExplanation();
    detectedBadge.textContent = '';
    saveSelection();
    if (liveToggle.checked) doTranslate();
  });
  targetSelect.addEventListener('change', () => {
    resetExplanation();
    saveSelection();
    if (liveToggle.checked) doTranslate();
  });

  sourceText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      doTranslate();
    }
  });

  liveToggle.addEventListener('change', () => {
    localStorage.setItem(LIVE_STORAGE, liveToggle.checked ? 'on' : 'off');
    if (liveToggle.checked) doTranslate();
  });
  sourceText.addEventListener('input', () => {
    resetExplanation();
    updateCharCounter();
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
