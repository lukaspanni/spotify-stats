import type { Env } from './types.js';
import { corsAllowHeaders, corsAllowMethods } from './constants.js';
import { getAllowedCorsOrigins } from './config.js';

export const buildCorsHeaders = (request: Request, env: Env): Headers => {
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

export const applyCorsHeaders = (request: Request, env: Env, headers: Headers): void => {
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
