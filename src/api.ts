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
    confidence: number;
  };
}

export const AUTO_CODE = 'auto';
export const DEFAULT_INSTANCE = 'https://translate.libregalaxy.org';
const LEGACY_DEFAULT = 'https://libretranslate.com';

const KEY_STORAGE = 'libretranslate:key';
const URL_STORAGE = 'libretranslate:url';

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