import type { TranslateResult } from './api.js';

export interface LlmConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface LlmProvider {
  name: string;
  baseUrl: string;
  defaultModel: string;
  api: 'openai' | 'anthropic';
}

export const LLM_PROVIDERS: Record<string, LlmProvider> = {
  openai: { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini', api: 'openai' },
  anthropic: { name: 'Anthropic', baseUrl: 'https://api.anthropic.com', defaultModel: 'claude-sonnet-4-20250514', api: 'anthropic' },
  groq: { name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile', api: 'openai' },
  openrouter: { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'meta-llama/llama-3.3-70b-instruct', api: 'openai' },
  custom: { name: 'Custom (OpenAI-compatible)', baseUrl: '', defaultModel: '', api: 'openai' },
};

export interface LlmParams {
  q: string;
  source: string;
  sourceName: string;
  targetName: string;
  alternatives: number;
}

interface LlmJson {
  translatedText?: unknown;
  alternatives?: unknown;
  detectedLanguage?: unknown;
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function buildPrompt(params: LlmParams): string {
  const lines: string[] = [
    'You are a professional translator.',
    `Translate the user's text ${params.source === 'auto' ? 'from the source language (detect it)' : `from ${params.sourceName}`} into ${params.targetName}.`,
    'Return ONLY valid JSON with no markdown, no code fences, and no commentary.',
    'The JSON must have exactly this shape: {"translatedText": "<translation>", "detectedLanguage": "<source language name in English>"}.',
    '"translatedText" must be the full translation. Preserve line breaks and formatting. Do not add explanations.',
  ];
  if (params.source === 'auto') {
    lines.push('"detectedLanguage" is required and must be the English name of the language you detected.');
  } else {
    lines.push('"detectedLanguage" is not needed; omit it.');
  }
  if (params.alternatives > 0) {
    lines.push(`Also include "alternatives": an array of up to ${params.alternatives} other natural alternative translations (fewer if there are no good alternatives).`);
  }
  lines.push('Respond with nothing but the JSON object.');
  return lines.join('\n');
}

function parseLlmJson(text: string): LlmJson {
  const clean = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      const obj = JSON.parse(clean.slice(start, end + 1)) as LlmJson;
      if (typeof obj.translatedText === 'string') return obj;
    } catch {
      // fall through to raw text
    }
  }
  return { translatedText: text.trim() };
}

function extractError(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const err = (data as { error?: unknown }).error;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      const msg = (err as { message?: unknown }).message;
      if (typeof msg === 'string') return msg;
    }
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  return `HTTP ${status}`;
}

async function openaiChat(baseUrl: string, apiKey: string, model: string, prompt: string, q: string): Promise<string> {
  const res = await fetch(`${trimSlash(baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: q },
      ],
      temperature: 0.2,
      max_tokens: 8192,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractError(data, res.status));
  const content = data && typeof data === 'object' ? (data as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]?.message?.content : undefined;
  if (typeof content !== 'string') throw new Error('Unexpected LLM response');
  return content;
}

async function anthropicMessages(baseUrl: string, apiKey: string, model: string, prompt: string, q: string): Promise<string> {
  const res = await fetch(`${trimSlash(baseUrl)}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      temperature: 0.2,
      system: prompt,
      messages: [{ role: 'user', content: q }],
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractError(data, res.status));
  const content =
    data && typeof data === 'object'
      ? (data as { content?: { type?: string; text?: unknown }[] }).content?.find((c) => c.type === 'text')?.text
      : undefined;
  if (typeof content !== 'string') throw new Error('Unexpected LLM response');
  return content;
}

export async function translateWithLLM(config: LlmConfig, params: LlmParams): Promise<TranslateResult> {
  const provider = LLM_PROVIDERS[config.provider] ?? LLM_PROVIDERS.custom;
  const baseUrl = (config.baseUrl || provider.baseUrl).trim();
  const model = (config.model || provider.defaultModel).trim();
  if (!config.apiKey.trim()) throw new Error('No LLM API key set. Add it in Settings.');
  if (!baseUrl) throw new Error('No LLM base URL set. Add it in Settings.');
  if (!model) throw new Error('No LLM model set. Add it in Settings.');

  const prompt = buildPrompt(params);
  const content =
    provider.api === 'anthropic'
      ? await anthropicMessages(baseUrl, config.apiKey, model, prompt, params.q)
      : await openaiChat(baseUrl, config.apiKey, model, prompt, params.q);

  const parsed = parseLlmJson(content);
  const result: TranslateResult = { translatedText: parsed.translatedText as string };
  if (Array.isArray(parsed.alternatives)) {
    result.alternatives = parsed.alternatives
      .map((a) => String(a))
      .filter((a) => a && a !== result.translatedText)
      .slice(0, 5);
  }
  if (typeof parsed.detectedLanguage === 'string' && parsed.detectedLanguage.trim()) {
    result.detectedLanguage = { language: parsed.detectedLanguage.trim() };
  }
  return result;
}
