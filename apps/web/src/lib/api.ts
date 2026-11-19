export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const REFRESH_KEY = 'bookflow.refreshToken';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Access token lives only in memory (not readable by other tabs or persisted);
 * the refresh token is persisted so a page reload keeps the session.
 */
let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;
let onSessionExpired: (() => void) | null = null;

export const session = {
  setTokens(tokens: Tokens) {
    accessToken = tokens.accessToken;
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear() {
    accessToken = null;
    localStorage.removeItem(REFRESH_KEY);
  },
  get refreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  },
  onExpired(cb: () => void) {
    onSessionExpired = cb;
  },
};

/** Exchanges the stored refresh token for a new pair. Concurrent callers share one request. */
export function refreshSession(): Promise<boolean> {
  const refreshToken = session.refreshToken;
  if (!refreshToken) return Promise.resolve(false);
  refreshPromise ??= fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) {
        session.clear();
        return false;
      }
      session.setTokens(await res.json());
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(`${API_URL}${path}`);
  Object.entries(query ?? {}).forEach(
    ([k, v]) => v !== undefined && v !== '' && url.searchParams.set(k, v),
  );
  return url.toString();
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

async function toError(res: Response): Promise<ApiError> {
  let message = res.statusText || 'Request failed';
  try {
    const body = await res.json();
    message = Array.isArray(body.message) ? body.message.join('. ') : (body.message ?? message);
  } catch {
    /* non-JSON body */
  }
  return new ApiError(res.status, message);
}

/** Fetch wrapper: JSON in/out, bearer token, one transparent refresh on 401. */
export async function apiFetch(path: string, options: RequestOptions = {}): Promise<Response> {
  let res: Response;
  try {
    res = await send(path, options);
  } catch {
    throw new ApiError(0, 'Could not reach the server. Please check your connection and retry.');
  }
  if (res.status === 401 && session.refreshToken && !path.startsWith('/auth/')) {
    if (await refreshSession()) {
      res = await send(path, options);
    } else {
      onSessionExpired?.();
    }
  }
  if (!res.ok) throw await toError(res);
  return res;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await apiFetch(path, options);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/**
 * The API runs on a free tier that sleeps when idle. Pinging /health as soon as the app
 * loads wakes it up while the visitor reads, so the first real request is fast.
 */
export function warmUpApi() {
  fetch(`${API_URL}/health`, { cache: 'no-store' }).catch(() => undefined);
}
