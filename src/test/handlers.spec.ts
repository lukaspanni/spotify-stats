import { handleOptions, handleLogin, handleFeatureFlags, handleSetTokens, handleGetTokens } from '../handlers.js';
import type { Env } from '../types.js';

describe('handlers', () => {
  const createEnv = (): Env => ({
    SPOTIFY_CLIENT_ID: 'test-client-id',
    SPOTIFY_CLIENT_SECRET: 'test-client-secret',
    REDIRECT_URL: 'https://example.com/callback',
    ASSETS: {} as Fetcher
  });

  const createRequest = (url: string, method: string = 'GET', origin?: string): Request => {
    const headers = new Headers();
    if (origin) headers.set('Origin', origin);
    return new Request(url, { method, headers });
  };

  describe('handleOptions', () => {
    it('returns 204 response with CORS headers', () => {
      const env = createEnv();
      const request = createRequest('https://api.example.com/test', 'OPTIONS', 'https://api.example.com');

      const response = handleOptions(request, env);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });

    it('includes origin in CORS headers when origin matches', () => {
      const env = createEnv();
      const request = createRequest('https://api.example.com/test', 'OPTIONS', 'https://api.example.com');

      const response = handleOptions(request, env);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://api.example.com');
    });
  });

  describe('handleLogin', () => {
    it('returns 405 for non-GET requests', () => {
      const env = createEnv();
      const request = createRequest('https://api.example.com/login', 'POST');

      const response = handleLogin(request, env);

      expect(response.status).toBe(405);
    });

    it('returns 500 when environment is not configured', () => {
      const env = {} as Env;
      const request = createRequest('https://api.example.com/login', 'GET');

      const response = handleLogin(request, env);

      expect(response.status).toBe(500);
    });

    it('redirects to Spotify authorization with state cookie', () => {
      const env = createEnv();
      const request = createRequest('https://api.example.com/login', 'GET');

      const response = handleLogin(request, env);

      expect(response.status).toBe(302);
      const location = response.headers.get('Location');
      expect(location).toContain('accounts.spotify.com/authorize');
      expect(location).toContain('client_id=test-client-id');
      expect(location).toContain('redirect_uri=');
      expect(location).toContain('state=');

      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain('auth-state=');
    });

    it('includes required OAuth parameters in redirect URL', () => {
      const env = createEnv();
      const request = createRequest('https://api.example.com/login', 'GET');

      const response = handleLogin(request, env);

      const location = response.headers.get('Location')!;
      expect(location).toContain('response_type=code');
      expect(location).toContain('scope=');
      expect(location).toContain('user-read-private');
      expect(location).toContain('user-top-read');
    });
  });

  describe('handleFeatureFlags', () => {
    it('returns 405 for non-GET requests', () => {
      const env = createEnv();
      const request = createRequest('https://api.example.com/api/feature-flags', 'POST');

      const response = handleFeatureFlags(request, env);

      expect(response.status).toBe(405);
    });

    it('returns feature flags with recommendations disabled by default', async () => {
      const env = createEnv();
      const request = createRequest('https://api.example.com/api/feature-flags', 'GET');

      const response = handleFeatureFlags(request, env);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = await response.json();
      expect(data).toEqual({ recommendations: false });
    });

    it('returns feature flags with recommendations enabled when env var is "true"', async () => {
      const env = { ...createEnv(), ENABLE_RECOMMENDATIONS: 'true' };
      const request = createRequest('https://api.example.com/api/feature-flags', 'GET');

      const response = handleFeatureFlags(request, env);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ recommendations: true });
    });

    it('returns feature flags with recommendations disabled for any non-"true" value', async () => {
      const env = { ...createEnv(), ENABLE_RECOMMENDATIONS: 'false' };
      const request = createRequest('https://api.example.com/api/feature-flags', 'GET');

      const response = handleFeatureFlags(request, env);

      const data = await response.json();
      expect(data).toEqual({ recommendations: false });
    });

    it('includes CORS headers in response', () => {
      const env = createEnv();
      const request = createRequest('https://api.example.com/api/feature-flags', 'GET', 'https://api.example.com');

      const response = handleFeatureFlags(request, env);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://api.example.com');
    });
  });

  describe('handleSetTokens', () => {
    const createRequestWithBody = (url: string, method: string, body?: object, origin?: string): Request => {
      const headers = new Headers({ 'Content-Type': 'application/json' });
      if (origin) headers.set('Origin', origin);
      return new Request(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
    };

    it('returns 405 for non-POST requests', async () => {
      const env = createEnv();
      const request = createRequestWithBody('https://api.example.com/api/set-tokens', 'GET');

      const response = await handleSetTokens(request, env);

      expect(response.status).toBe(405);
    });

    it('returns 400 when body is missing', async () => {
      const env = createEnv();
      const request = createRequestWithBody('https://api.example.com/api/set-tokens', 'POST');

      const response = await handleSetTokens(request, env);

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error?: string };
      expect(data.error).toBeTruthy();
    });

    it('returns 400 when accessToken is missing', async () => {
      const env = createEnv();
      const request = createRequestWithBody('https://api.example.com/api/set-tokens', 'POST', {
        refreshToken: 'test-refresh-token'
      });

      const response = await handleSetTokens(request, env);

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error?: string };
      expect(data.error).toContain('Missing');
    });

    it('returns 400 when refreshToken is missing', async () => {
      const env = createEnv();
      const request = createRequestWithBody('https://api.example.com/api/set-tokens', 'POST', {
        accessToken: 'test-access-token'
      });

      const response = await handleSetTokens(request, env);

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error?: string };
      expect(data.error).toContain('Missing');
    });

    it('returns 200 and sets cookie with valid tokens', async () => {
      const env = createEnv();
      const request = createRequestWithBody('https://api.example.com/api/set-tokens', 'POST', {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      });

      const response = await handleSetTokens(request, env);

      expect(response.status).toBe(200);
      const data = (await response.json()) as { success?: boolean };
      expect(data.success).toBe(true);

      const setCookie = response.headers.get('Set-Cookie');
      expect(setCookie).toContain('accessToken=');
      expect(setCookie).toContain('test-access-token');
      expect(setCookie).toContain('test-refresh-token');
    });

    it('includes CORS headers in response', async () => {
      const env = createEnv();
      const request = createRequestWithBody(
        'https://api.example.com/api/set-tokens',
        'POST',
        {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token'
        },
        'https://api.example.com'
      );

      const response = await handleSetTokens(request, env);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://api.example.com');
    });
  });

  describe('handleGetTokens', () => {
    const createRequestWithCookies = (url: string, method: string, cookies?: string, origin?: string): Request => {
      const headers = new Headers();
      if (cookies) headers.set('Cookie', cookies);
      if (origin) headers.set('Origin', origin);
      return new Request(url, { method, headers });
    };

    it('returns 405 for non-GET requests', async () => {
      const env = createEnv();
      const request = createRequestWithCookies('https://api.example.com/api/get-tokens', 'POST');

      const response = await handleGetTokens(request, env);

      expect(response.status).toBe(405);
    });

    it('returns 404 when no tokens are found', async () => {
      const env = createEnv();
      const request = createRequestWithCookies('https://api.example.com/api/get-tokens', 'GET');

      const response = await handleGetTokens(request, env);

      expect(response.status).toBe(404);
      const data = (await response.json()) as { error?: string };
      expect(data.error).toContain('No tokens found');
    });

    it('returns 404 when accessToken cookie is invalid', async () => {
      const env = createEnv();
      const request = createRequestWithCookies(
        'https://api.example.com/api/get-tokens',
        'GET',
        'accessToken=invalid-json'
      );

      const response = await handleGetTokens(request, env);

      expect(response.status).toBe(404);
      const data = (await response.json()) as { error?: string };
      expect(data.error).toContain('No tokens found');
    });

    it('returns tokens when valid cookie exists', async () => {
      const env = createEnv();
      const tokenData = {
        token: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expires: Date.now() + 3600000
      };
      const cookieValue = encodeURIComponent(JSON.stringify(tokenData));
      const request = createRequestWithCookies(
        'https://api.example.com/api/get-tokens',
        'GET',
        `accessToken=${cookieValue}`
      );

      const response = await handleGetTokens(request, env);

      expect(response.status).toBe(200);
      const data = (await response.json()) as { accessToken?: string; refreshToken?: string; expires?: number };
      expect(data.accessToken).toBe('test-access-token');
      expect(data.refreshToken).toBe('test-refresh-token');
      expect(data.expires).toBe(tokenData.expires);
    });

    it('includes CORS headers in response', async () => {
      const env = createEnv();
      const request = createRequestWithCookies(
        'https://api.example.com/api/get-tokens',
        'GET',
        undefined,
        'https://api.example.com'
      );

      const response = await handleGetTokens(request, env);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://api.example.com');
    });
  });
});
