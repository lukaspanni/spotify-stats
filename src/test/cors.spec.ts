import { buildCorsHeaders, applyCorsHeaders } from '../cors.js';
import type { Env } from '../types.js';

describe('cors', () => {
  const createEnv = (allowedOrigins?: string): Env => ({
    SPOTIFY_CLIENT_ID: 'id',
    SPOTIFY_CLIENT_SECRET: 'secret',
    REDIRECT_URL: 'url',
    CORS_ALLOWED_ORIGINS: allowedOrigins,
    ASSETS: {} as Fetcher
  });

  const createRequest = (url: string, origin?: string): Request => {
    const headers = new Headers();
    if (origin) headers.set('Origin', origin);
    return new Request(url, { headers });
  };

  describe('buildCorsHeaders', () => {
    it('sets CORS headers when origin matches request origin', () => {
      const env = createEnv();
      const request = createRequest('https://example.com/api', 'https://example.com');

      const headers = buildCorsHeaders(request, env);

      expect(headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
      expect(headers.get('Vary')).toBe('Origin');
      expect(headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });

    it('sets CORS headers when origin is in allowed list', () => {
      const env = createEnv('https://app.example.com,https://test.example.com');
      const request = createRequest('https://api.example.com/data', 'https://app.example.com');

      const headers = buildCorsHeaders(request, env);

      expect(headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com');
      expect(headers.get('Vary')).toBe('Origin');
    });

    it('does not set origin when origin is not allowed', () => {
      const env = createEnv('https://app.example.com');
      const request = createRequest('https://api.example.com/data', 'https://malicious.com');

      const headers = buildCorsHeaders(request, env);

      expect(headers.get('Access-Control-Allow-Origin')).toBeNull();
      expect(headers.get('Vary')).toBeNull();
    });

    it('handles request without origin header', () => {
      const env = createEnv();
      const request = createRequest('https://example.com/api');

      const headers = buildCorsHeaders(request, env);

      expect(headers.get('Access-Control-Allow-Origin')).toBeNull();
      expect(headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });
  });

  describe('applyCorsHeaders', () => {
    it('applies CORS headers to existing headers', () => {
      const env = createEnv();
      const request = createRequest('https://example.com/api', 'https://example.com');
      const headers = new Headers({ 'Content-Type': 'application/json' });

      applyCorsHeaders(request, env, headers);

      expect(headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
      expect(headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(headers.get('Access-Control-Allow-Headers')).toBeTruthy();
      expect(headers.get('Vary')).toBe('Origin');
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('removes existing CORS headers before applying new ones', () => {
      const env = createEnv('https://app.example.com');
      const request = createRequest('https://api.example.com/data', 'https://app.example.com');
      const headers = new Headers({
        'Access-Control-Allow-Origin': 'https://old.example.com',
        'Access-Control-Allow-Methods': 'GET',
        Vary: 'Accept-Encoding'
      });

      applyCorsHeaders(request, env, headers);

      expect(headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com');
      expect(headers.get('Access-Control-Allow-Methods')).not.toBe('GET');
      expect(headers.get('Vary')).toBe('Origin');
    });

    it('does not set origin header when origin is not allowed', () => {
      const env = createEnv('https://app.example.com');
      const request = createRequest('https://api.example.com/data', 'https://malicious.com');
      const headers = new Headers();

      applyCorsHeaders(request, env, headers);

      expect(headers.get('Access-Control-Allow-Origin')).toBeNull();
      expect(headers.get('Vary')).toBeNull();
    });
  });
});
