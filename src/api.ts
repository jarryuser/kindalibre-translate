export interface Language {
  code: string;
  name: string;
  targets?: string[];
}

export interface Settings {
  apiKeys: boolean;
  charLimit: number;
  keyRequired: boolean;
}

export interface TranslateResult {
  translatedText: string;
  alternatives?: string[];
  detectedLanguage?: {
    language: string;
    confidence?: number;
  };
}

export const AUTO_CODE = 'auto';
export const DEFAULT_INSTANCE = 'https://translate.libregalaxy.org';
const LEGACY_DEFAULT = 'https://libretranslate.com';

const KEY_STORAGE = 'kindalibre:key';
const URL_STORAGE = 'kindalibre:url';
const ENGINE_STORAGE = 'kindalibre:engine';
const LLM_PROVIDER_STORAGE = 'kindalibre:llm:provider';
const LLM_KEY_STORAGE = 'kindalibre:llm:key';
const LLM_BASE_STORAGE = 'kindalibre:llm:base';
const LLM_MODEL_STORAGE = 'kindalibre:llm:model';

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getApiKey(): string {
  return localStorage.getItem(KEY_STORAGE) ?? '';
}

export function saveApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(KEY_STORAGE);
  }
}

export function getApiUrl(): string {
  const stored = localStorage.getItem(URL_STORAGE);
  if (stored && stored !== LEGACY_DEFAULT) return stored;
  return DEFAULT_INSTANCE;
}

export function saveApiUrl(url: string): void {
  const clean = url.trim();
  if (clean && clean !== DEFAULT_INSTANCE) {
    localStorage.setItem(URL_STORAGE, clean);
  } else {
    localStorage.removeItem(URL_STORAGE);
  }
}

export type Engine = 'libretranslate' | 'llm';

export interface LlmConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function getEngine(): Engine {
  return localStorage.getItem(ENGINE_STORAGE) === 'llm' ? 'llm' : 'libretranslate';
}

export function saveEngine(engine: Engine): void {
  if (engine === 'llm') {
    localStorage.setItem(ENGINE_STORAGE, 'llm');
  } else {
    localStorage.removeItem(ENGINE_STORAGE);
  }
}

export function getLlmConfig(): LlmConfig {
  return {
    provider: localStorage.getItem(LLM_PROVIDER_STORAGE) ?? 'openai',
    apiKey: localStorage.getItem(LLM_KEY_STORAGE) ?? '',
    baseUrl: localStorage.getItem(LLM_BASE_STORAGE) ?? '',
    model: localStorage.getItem(LLM_MODEL_STORAGE) ?? '',
  };
}

export function saveLlmConfig(cfg: LlmConfig): void {
  if (cfg.provider) {
    localStorage.setItem(LLM_PROVIDER_STORAGE, cfg.provider);
  } else {
    localStorage.removeItem(LLM_PROVIDER_STORAGE);
  }
  if (cfg.apiKey.trim()) {
    localStorage.setItem(LLM_KEY_STORAGE, cfg.apiKey.trim());
  } else {
    localStorage.removeItem(LLM_KEY_STORAGE);
  }
  if (cfg.baseUrl.trim()) {
    localStorage.setItem(LLM_BASE_STORAGE, cfg.baseUrl.trim());
  } else {
    localStorage.removeItem(LLM_BASE_STORAGE);
  }
  if (cfg.model.trim()) {
    localStorage.setItem(LLM_MODEL_STORAGE, cfg.model.trim());
  } else {
    localStorage.removeItem(LLM_MODEL_STORAGE);
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json().catch(() => null)) as T | null;
  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export function fetchLanguages(instance: string): Promise<Language[]> {
  return requestJson<Language[]>(`${trimSlash(instance)}/languages`);
}

export async function fetchSettings(instance: string): Promise<Settings | null> {
  try {
    return await requestJson<Settings>(`${trimSlash(instance)}/frontend/settings`);
  } catch {
    return null;
  }
}

export interface TranslateParams {
  q: string;
  source: string;
  target: string;
  format?: 'text' | 'html';
  alternatives?: number;
}

export function translate(instance: string, apiKey: string, params: TranslateParams): Promise<TranslateResult> {
  const body: Record<string, unknown> = {
    q: params.q,
    source: params.source,
    target: params.target,
    format: params.format ?? 'text',
  };
  if (params.alternatives) {
    body.alternatives = params.alternatives;
  }
  if (apiKey) {
    body.api_key = apiKey;
  }
  return requestJson<TranslateResult>(`${trimSlash(instance)}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}