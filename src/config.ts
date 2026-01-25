import type { Env, EnvConfig } from './types.js';

export const getEnvConfig = (env: Env): EnvConfig | null => {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !env.REDIRECT_URL) return null;
  return { clientId: env.SPOTIFY_CLIENT_ID, clientSecret: env.SPOTIFY_CLIENT_SECRET, redirectUrl: env.REDIRECT_URL };
};

export const getAllowedCorsOrigins = (env: Env): string[] => {
  const rawOrigins = env.CORS_ALLOWED_ORIGINS;
  if (!rawOrigins) return [];
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};
