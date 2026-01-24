import { buildSetCookieHeader, parseCookies } from '../cookies.js';

describe('worker cookie helpers', () => {
  it('parses cookies and decodes encoded values', () => {
    const cookies = parseCookies('accessToken=%7B%7D; auth-state=abc123');

    expect(cookies['accessToken']).toBe('{}');
    expect(cookies['auth-state']).toBe('abc123');
  });

  it('parses cookies with empty values', () => {
    const cookies = parseCookies('token=; state=abc');

    expect(cookies['token']).toBe('');
    expect(cookies['state']).toBe('abc');
  });

  it('returns empty object for null cookie header', () => {
    const cookies = parseCookies(null);

    expect(cookies).toEqual({});
  });

  it('handles malformed cookies gracefully', () => {
    const cookies = parseCookies('invalid');

    expect(cookies['invalid']).toBe('');
  });

  it('builds cookie headers with options', () => {
    const header = buildSetCookieHeader('accessToken', '{}', { maxAge: 60, sameSite: 'Lax' });

    expect(header).toContain('accessToken=%7B%7D');
    expect(header).toContain('Max-Age=60');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('Path=/');
  });

  it('builds cookie headers with all options', () => {
    const header = buildSetCookieHeader('token', 'value', {
      maxAge: 3600,
      httpOnly: true,
      secure: true,
      sameSite: 'Strict'
    });

    expect(header).toContain('token=value');
    expect(header).toContain('Max-Age=3600');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('Secure');
    expect(header).toContain('SameSite=Strict');
  });

  it('builds cookie headers without options', () => {
    const header = buildSetCookieHeader('simple', 'value');

    expect(header).toBe('simple=value; Path=/');
  });
});
