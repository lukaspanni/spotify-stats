import type { Env, AccessToken } from './types.js';
import {
  scopes,
  accountBaseUrl,
  stateKey,
  accessTokenCookie,
  emptyAccessTokenCookieValue,
  accessTokenMaxAgeSeconds,
  baseUrl
} from './constants.js';
import { parseCookies, buildSetCookieHeader } from './cookies.js';
import { getEnvConfig } from './config.js';
import { generateState, buildExpiryTimestamp } from './auth.js';
import { requestToken } from './spotify-client.js';
import { buildCorsHeaders, applyCorsHeaders } from './cors.js';
import { missingEnvResponse, redirectInvalidToken, buildRedirectResponse } from './response-helpers.js';

export const handleOptions = (request: Request, env: Env): Response => {
  const headers = buildCorsHeaders(request, env);
  return new Response(null, { status: 204, headers });
};

export const handleFeatureFlags = (request: Request, env: Env): Response => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });

  const flags = {
    recommendations: env.ENABLE_RECOMMENDATIONS === 'true'
  };

  const headers = buildCorsHeaders(request, env);
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify(flags), { status: 200, headers });
};

export const handleLogin = (request: Request, env: Env): Response => {
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

export const handleSpotifyCallback = async (request: Request, env: Env): Promise<Response> => {
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const config = getEnvConfig(env);
  if (!config) return missingEnvResponse();

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookies = parseCookies(request.headers.get('Cookie'));
  const storedState = cookies[stateKey];

  if (!code || !state || state !== storedState) return new Response('Error, state did not match', { status: 400 });

  const data = new URLSearchParams({ code, redirect_uri: config.redirectUrl, grant_type: 'authorization_code' });

  try {
    const responseData = await requestToken(config, data);
    if (!responseData) return redirectInvalidToken();

    const accessToken: AccessToken = {
      token: responseData.access_token,
      expires: buildExpiryTimestamp(responseData.expires_in),
      refreshToken: responseData.refresh_token
    };

    const headers = new Headers({ Location: '/' });
    headers.append('Set-Cookie', buildSetCookieHeader(stateKey, '', { maxAge: 0 }));
    headers.append(
      'Set-Cookie',
      buildSetCookieHeader(accessTokenCookie, JSON.stringify(accessToken), { maxAge: accessTokenMaxAgeSeconds })
    );
    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error('Error exchanging token', err);
    return redirectInvalidToken();
  }
};

export const handleRefreshToken = async (request: Request, env: Env): Promise<Response> => {
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
    return buildRedirectResponse('/login', [buildSetCookieHeader(accessTokenCookie, emptyAccessTokenCookieValue)]);

  const data = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: accessToken.refreshToken });

  try {
    const responseData = await requestToken(config, data);
    if (!responseData)
      return buildRedirectResponse('/#' + new URLSearchParams({ error: 'invalid_token' }), [
        buildSetCookieHeader(accessTokenCookie, emptyAccessTokenCookieValue)
      ]);

    const refreshedToken: AccessToken = {
      token: responseData.access_token,
      expires: buildExpiryTimestamp(responseData.expires_in),
      refreshToken: responseData.refresh_token ?? accessToken.refreshToken
    };

    return buildRedirectResponse('/', [
      buildSetCookieHeader(accessTokenCookie, JSON.stringify(refreshedToken), { maxAge: accessTokenMaxAgeSeconds })
    ]);
  } catch (err) {
    console.error('Error refreshing token', err);
    return buildRedirectResponse('/#' + new URLSearchParams({ error: 'invalid_token' }), [
      buildSetCookieHeader(accessTokenCookie, emptyAccessTokenCookieValue)
    ]);
  }
};

export const handleSetTokens = async (request: Request, env: Env): Promise<Response> => {
  if (request.method !== 'POST') {
    const headers = buildCorsHeaders(request, env);
    return new Response('Method Not Allowed', { status: 405, headers });
  }

  let body: { accessToken?: string; refreshToken?: string; expires?: number };
  try {
    body = await request.json();
  } catch (err) {
    const headers = buildCorsHeaders(request, env);
    headers.set('Content-Type', 'application/json');
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers });
  }

  if (!body.accessToken || !body.refreshToken) {
    const headers = buildCorsHeaders(request, env);
    headers.set('Content-Type', 'application/json');
    return new Response(JSON.stringify({ error: 'Missing accessToken or refreshToken' }), { status: 400, headers });
  }

  const accessToken: AccessToken = {
    token: body.accessToken,
    // Default to 1 hour (3600 seconds) if expires not provided, which matches Spotify's typical access token lifetime
    // The token can still be refreshed using the refresh_token when it expires
    expires: body.expires || buildExpiryTimestamp(3600),
    refreshToken: body.refreshToken
  };

  const headers = buildCorsHeaders(request, env);
  headers.set('Content-Type', 'application/json');
  headers.append(
    'Set-Cookie',
    buildSetCookieHeader(accessTokenCookie, JSON.stringify(accessToken), { maxAge: accessTokenMaxAgeSeconds })
  );

  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
};

export const handleGetTokens = async (request: Request, env: Env): Promise<Response> => {
  if (request.method !== 'GET') {
    const headers = buildCorsHeaders(request, env);
    return new Response('Method Not Allowed', { status: 405, headers });
  }

  const cookies = parseCookies(request.headers.get('Cookie'));
  const storedToken = cookies[accessTokenCookie];
  let accessToken: AccessToken | null = null;

  try {
    accessToken = storedToken ? (JSON.parse(storedToken) as AccessToken) : null;
  } catch (err) {
    console.error('Error parsing access token', err);
  }

  const headers = buildCorsHeaders(request, env);
  headers.set('Content-Type', 'application/json');

  if (!accessToken?.token || !accessToken?.refreshToken)
    return new Response(JSON.stringify({ error: 'No tokens found' }), { status: 404, headers });

  return new Response(
    JSON.stringify({
      accessToken: accessToken.token,
      refreshToken: accessToken.refreshToken,
      expires: accessToken.expires
    }),
    { status: 200, headers }
  );
};

export const handleProxy = async (request: Request, env: Env): Promise<Response> => {
  const url = new URL(request.url);
  const proxyPath = url.pathname.replace(/^\/proxy-api\/?/, '');
  if (!proxyPath) return new Response('Not Found', { status: 404 });
  if (proxyPath.includes('://') || proxyPath.includes('..') || proxyPath.startsWith('/'))
    return new Response('Invalid proxy target', { status: 400 });

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
