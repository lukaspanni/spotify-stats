import type { Env } from './types.js';
import { handleOptions, handleLogin, handleSpotifyCallback, handleRefreshToken, handleProxy } from './handlers.js';

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

// Export for testing
export { parseCookies, buildSetCookieHeader } from './cookies.js';
