'use client';

const JSON_CONTENT_TYPE = /\b(?:application|text)\/(?:[\w.+-]*\+)?json\b/i;

export function getCsrfToken() {
  if (typeof document === 'undefined') return '';
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith('csrftoken='));
  return cookie ? decodeURIComponent(cookie.slice('csrftoken='.length)) : '';
}

export function apiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const data = payload as Record<string, unknown>;
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;

  const messages = Object.values(data).flatMap((value) => {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') return [value];
    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).flatMap((item) =>
        Array.isArray(item) ? item.map(String) : typeof item === 'string' ? [item] : [],
      );
    }
    return [];
  });
  return messages.filter(Boolean).join(' ') || fallback;
}

export async function readApiResponse<T = any>(response: Response): Promise<T> {
  if (response.status === 204) return null as T;

  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  let payload: unknown = {};

  if (text) {
    if (JSON_CONTENT_TYPE.test(contentType) || /^[\s\r\n]*[\[{]/.test(text)) {
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error(`The server returned invalid data (${response.status}). Please try again.`);
      }
    } else if (!response.ok) {
      throw new Error(`The server is temporarily unavailable (${response.status}). Please try again.`);
    } else {
      throw new Error('The server returned an unexpected response. Please try again.');
    }
  }

  if (!response.ok) {
    throw new Error(apiErrorMessage(payload, `Request failed (${response.status}).`));
  }
  return payload as T;
}

export async function ensureCsrfToken() {
  const existing = getCsrfToken();
  if (existing) return existing;

  const response = await fetch('/api/auth/status/', {
    credentials: 'include',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  await readApiResponse(response);

  const token = getCsrfToken();
  if (!token) throw new Error('A secure session could not be created. Refresh the page and try again.');
  return token;
}

export async function csrfFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = await ensureCsrfToken();
  const headers = new Headers(init.headers);
  headers.set('X-CSRFToken', token);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  return fetch(input, { ...init, credentials: 'include', headers });
}
