import { buildSetCookieHeader, parseCookies } from '../index';

describe('worker cookie helpers', () => {
  it('parses cookies and decodes encoded values', () => {
    const cookies = parseCookies('accessToken=%7B%7D; auth-state=abc123');

    expect(cookies['accessToken']).toBe('{}');
    expect(cookies['auth-state']).toBe('abc123');
  });

  it('builds cookie headers with options', () => {
    const header = buildSetCookieHeader('accessToken', '{}', { maxAge: 60, sameSite: 'Lax' });

    expect(header).toContain('accessToken=%7B%7D');
    expect(header).toContain('Max-Age=60');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('Path=/');
  });
});
