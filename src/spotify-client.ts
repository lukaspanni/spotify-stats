import type { EnvConfig, TokenResponse } from './types.js';
import { accountBaseUrl } from './constants.js';
import { buildBasicAuth } from './auth.js';

export const requestToken = async (config: EnvConfig, data: URLSearchParams): Promise<TokenResponse | null> => {
  const response = await fetch(`${accountBaseUrl}api/token`, {
    method: 'POST',
    body: data.toString(),
    headers: {
      Authorization: buildBasicAuth(config.clientId, config.clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) return null;
  return (await response.json()) as TokenResponse;
};
