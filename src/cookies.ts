import type { CookieOptions } from './types.js';

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
