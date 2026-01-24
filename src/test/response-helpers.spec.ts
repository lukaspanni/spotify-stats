import { missingEnvResponse, redirectInvalidToken, buildRedirectResponse } from '../response-helpers.js';

describe('response-helpers', () => {
  describe('missingEnvResponse', () => {
    it('returns 500 response with error message', async () => {
      const response = missingEnvResponse();

      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe('Missing Spotify environment variables.');
    });
  });

  describe('redirectInvalidToken', () => {
    it('returns redirect response with error parameter', () => {
      const response = redirectInvalidToken();

      expect(response.status).toBe(302);
      const location = response.headers.get('Location');
      expect(location).toContain('error=invalid_token');
      expect(location).toMatch(/^\/#/);
    });
  });

  describe('buildRedirectResponse', () => {
    it('returns redirect response with location', () => {
      const response = buildRedirectResponse('/success');

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/success');
    });

    it('includes cookies in Set-Cookie headers', () => {
      const cookies = ['token=value; Path=/', 'session=abc123; Path=/; HttpOnly'];
      const response = buildRedirectResponse('/dashboard', cookies);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/dashboard');

      // Note: Headers.get() only returns the first value for Set-Cookie
      // We need to check if the cookies are present
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toBeTruthy();
    });

    it('works without cookies', () => {
      const response = buildRedirectResponse('/home', []);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/home');
    });
  });
});
