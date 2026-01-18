type AccessToken = {
  token: string;
  expires: number;
  refreshToken?: string;
};

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

type Env = {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  REDIRECT_URL: string;
  CORS_ALLOWED_ORIGINS?: string;
};

type CookieOptions = {
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
};

const scopes = 'user-read-private user-read-email user-top-read playlist-modify-public playlist-modify-private';
const baseUrl = 'https://api.spotify.com/v1/';
const accountBaseUrl = 'https://accounts.spotify.com/';
const stateKey = 'auth-state';
const accessTokenCookie = 'accessToken';
const accessTokenMaxAgeSeconds = 60 * 60 * 24 * 30;
const corsAllowHeaders = 'Authorization,Content-Type';
const corsAllowMethods = 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS';

export const parseCookies = (cookieHeader: string | null): Record<string, string> => {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce<Record<string, string>>((cookies, cookie) => {
    const trimmed = cookie.trim();
    if (!trimmed) return cookies;
    const [name, ...valueParts] = trimmed.split('=');
    if (!name) return cookies;
    const value = valueParts.join('=');
    if (!value) {
      cookies[name] = '';
      return cookies;
    }
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      // If decoding fails, fall back to the raw cookie value.
      cookies[name] = value;
    }
    return cookies;
  }, {});
};

export const buildSetCookieHeader = (name: string, value: string, options: CookieOptions = {}): string => {
  const encodedValue = encodeURIComponent(value);
  const parts = [`${name}=${encodedValue}`, 'Path=/'];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join('; ');
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  }
};

const handleRequest = async (request: Request, env: Env): Promise<Response> => {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return handleOptions(request, env);

  if (url.pathname === '/login') return handleLogin(request, env);
  if (url.pathname === '/spotify-callback') return handleSpotifyCallback(request, env);
  if (url.pathname === '/refresh-token') return handleRefreshToken(request, env);
  if (url.pathname.startsWith('/proxy-api')) return handleProxy(request, env);

  return new Response('Not Found', { status: 404 });
};

const handleOptions = (request: Request, env: Env): Response => {
  const headers = buildCorsHeaders(request, env);
  return new Response(null, { status: 204, headers });
};

const handleLogin = (request: Request, env: Env): Response => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const config = getEnvConfig(env);
  if (!config) return missingEnvResponse();

  const state = generateState();
  const authQueryParams = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    scope: scopes,
    redirect_uri: config.redirectUrl,
    state
  });

  const redirectUrl = `${accountBaseUrl}authorize?${authQueryParams}`;
  const headers = new Headers({ Location: redirectUrl });
  headers.append('Set-Cookie', buildSetCookieHeader(stateKey, state));
  return new Response(null, { status: 302, headers });
};

const handleSpotifyCallback = async (request: Request, env: Env): Promise<Response> => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const config = getEnvConfig(env);
  if (!config) return missingEnvResponse();

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookies = parseCookies(request.headers.get('Cookie'));
  const storedState = cookies[stateKey];

  if (!code || !state || state !== storedState) return new Response('Error, state did not match', { status: 400 });

  const data = new URLSearchParams({
    code,
    redirect_uri: config.redirectUrl,
    grant_type: 'authorization_code'
  });

  try {
    const responseData = await requestToken(config, data);
    if (!responseData) return redirectInvalidToken();

    const accessToken: AccessToken = {
      token: responseData.access_token,
      expires: Date.now() + responseData.expires_in * 1000,
      refreshToken: responseData.refresh_token
    };

    const headers = new Headers({ Location: '/' });
    headers.append('Set-Cookie', buildSetCookieHeader(stateKey, '', { maxAge: 0 }));
    headers.append(
      'Set-Cookie',
      buildSetCookieHeader(accessTokenCookie, JSON.stringify(accessToken), {
        maxAge: accessTokenMaxAgeSeconds
      })
    );
    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error('Error exchanging token', err);
    return redirectInvalidToken();
  }
};

const handleRefreshToken = async (request: Request, env: Env): Promise<Response> => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const config = getEnvConfig(env);
  if (!config) return missingEnvResponse();

  const cookies = parseCookies(request.headers.get('Cookie'));
  const storedToken = cookies[accessTokenCookie];
  let accessToken: AccessToken | null = null;

  try {
    accessToken = storedToken ? (JSON.parse(storedToken) as AccessToken) : null;
  } catch (err) {
    console.error('Error parsing access token', err);
  }

  if (!accessToken?.refreshToken)
    return buildRedirectResponse('/login', [buildSetCookieHeader(accessTokenCookie, '{}')]);

  const data = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: accessToken.refreshToken
  });

  try {
    const responseData = await requestToken(config, data);
    if (!responseData)
      return buildRedirectResponse('/#' + new URLSearchParams({ error: 'invalid_token' }), [
        buildSetCookieHeader(accessTokenCookie, '{}')
      ]);

    const refreshedToken: AccessToken = {
      token: responseData.access_token,
      expires: Date.now() + responseData.expires_in * 1000,
      refreshToken: responseData.refresh_token ?? accessToken.refreshToken
    };

    return buildRedirectResponse('/', [
      buildSetCookieHeader(accessTokenCookie, JSON.stringify(refreshedToken), {
        maxAge: accessTokenMaxAgeSeconds
      })
    ]);
  } catch (err) {
    console.error('Error refreshing token', err);
    return buildRedirectResponse('/#' + new URLSearchParams({ error: 'invalid_token' }), [
      buildSetCookieHeader(accessTokenCookie, '{}')
    ]);
  }
};

const handleProxy = async (request: Request, env: Env): Promise<Response> => {
  const url = new URL(request.url);
  const proxyPath = url.pathname.replace(/^\/proxy-api\/?/, '');
  if (!proxyPath) return new Response('Not Found', { status: 404 });
  if (proxyPath.includes('://')) return new Response('Invalid proxy target', { status: 400 });

  const targetUrl = `${baseUrl}${proxyPath}${url.search}`;
  const headers = new Headers(request.headers);
  const authorization = request.headers.get('authorization');
  if (authorization) headers.set('Authorization', authorization);
  headers.delete('host');
  headers.delete('cookie');

  const init: RequestInit = {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual'
  };

  try {
    const response = await fetch(targetUrl, init);
    const responseHeaders = new Headers(response.headers);
    applyCorsHeaders(request, env, responseHeaders);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (err) {
    console.error('Proxy request failed', err);
    const headers = buildCorsHeaders(request, env);
    return new Response('Proxy request failed', { status: 502, headers });
  }
};

const requestToken = async (config: EnvConfig, data: URLSearchParams): Promise<TokenResponse | null> => {
  const response = await fetch(`${accountBaseUrl}api/token`, {
    method: 'POST',
    body: data.toString(),
    headers: {
      Authorization: buildBasicAuth(config.clientId, config.clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) return null;
  return (await response.json()) as TokenResponse;
};

type EnvConfig = {
  clientId: string;
  clientSecret: string;
  redirectUrl: string;
};

const getEnvConfig = (env: Env): EnvConfig | null => {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !env.REDIRECT_URL) return null;
  return {
    clientId: env.SPOTIFY_CLIENT_ID,
    clientSecret: env.SPOTIFY_CLIENT_SECRET,
    redirectUrl: env.REDIRECT_URL
  };
};

const missingEnvResponse = (): Response => {
  return new Response('Missing Spotify environment variables.', { status: 500 });
};

const buildBasicAuth = (clientId: string, clientSecret: string): string => {
  const value = `${clientId}:${clientSecret}`;
  return `Basic ${encodeBase64(value)}`;
};

const redirectInvalidToken = (): Response => {
  return buildRedirectResponse('/#' + new URLSearchParams({ error: 'invalid_token' }));
};

const buildRedirectResponse = (location: string, cookies: string[] = []): Response => {
  const headers = new Headers({ Location: location });
  cookies.forEach((cookie) => headers.append('Set-Cookie', cookie));
  return new Response(null, { status: 302, headers });
};

const buildCorsHeaders = (request: Request, env: Env): Headers => {
  const headers = new Headers();
  const origin = resolveCorsOrigin(request, env);
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
  headers.set('Access-Control-Allow-Methods', corsAllowMethods);
  headers.set('Access-Control-Allow-Headers', corsAllowHeaders);
  return headers;
};

const applyCorsHeaders = (request: Request, env: Env, headers: Headers): void => {
  headers.delete('Access-Control-Allow-Origin');
  headers.delete('Access-Control-Allow-Methods');
  headers.delete('Access-Control-Allow-Headers');
  headers.delete('Vary');
  const origin = resolveCorsOrigin(request, env);
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', corsAllowMethods);
    headers.set('Access-Control-Allow-Headers', corsAllowHeaders);
    headers.append('Vary', 'Origin');
  }
};

const resolveCorsOrigin = (request: Request, env: Env): string | null => {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  const requestOrigin = new URL(request.url).origin;
  const allowedOrigins = getAllowedCorsOrigins(env);
  if (origin === requestOrigin) return origin;
  return allowedOrigins.includes(origin) ? origin : null;
};

const getAllowedCorsOrigins = (env: Env): string[] => {
  const rawOrigins = env.CORS_ALLOWED_ORIGINS;
  if (!rawOrigins) return [];
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

const generateState = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const encodeBase64 = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};
