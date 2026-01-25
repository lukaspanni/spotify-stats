import { handleOptions, handleLogin } from '../handlers.js';
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
});
