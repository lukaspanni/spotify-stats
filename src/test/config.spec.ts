import { getEnvConfig, getAllowedCorsOrigins } from '../config.js';
import type { Env } from '../types.js';

describe('config', () => {
  describe('getEnvConfig', () => {
    it('returns config when all environment variables are present', () => {
      const env: Env = {
        SPOTIFY_CLIENT_ID: 'client-id',
        SPOTIFY_CLIENT_SECRET: 'client-secret',
        REDIRECT_URL: 'https://example.com/callback',
        ASSETS: {} as Fetcher
      };

      const config = getEnvConfig(env);

      expect(config).toEqual({
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUrl: 'https://example.com/callback'
      });
    });

    it('returns null when SPOTIFY_CLIENT_ID is missing', () => {
      const env = { SPOTIFY_CLIENT_SECRET: 'client-secret', REDIRECT_URL: 'https://example.com/callback' } as Env;

      const config = getEnvConfig(env);

      expect(config).toBeNull();
    });

    it('returns null when SPOTIFY_CLIENT_SECRET is missing', () => {
      const env = { SPOTIFY_CLIENT_ID: 'client-id', REDIRECT_URL: 'https://example.com/callback' } as Env;

      const config = getEnvConfig(env);

      expect(config).toBeNull();
    });

    it('returns null when REDIRECT_URL is missing', () => {
      const env = { SPOTIFY_CLIENT_ID: 'client-id', SPOTIFY_CLIENT_SECRET: 'client-secret' } as Env;

      const config = getEnvConfig(env);

      expect(config).toBeNull();
    });
  });

  describe('getAllowedCorsOrigins', () => {
    it('returns empty array when CORS_ALLOWED_ORIGINS is not set', () => {
      const env: Env = {
        SPOTIFY_CLIENT_ID: 'id',
        SPOTIFY_CLIENT_SECRET: 'secret',
        REDIRECT_URL: 'url',
        ASSETS: {} as Fetcher
      };

      const origins = getAllowedCorsOrigins(env);

      expect(origins).toEqual([]);
    });

    it('returns empty array when CORS_ALLOWED_ORIGINS is empty', () => {
      const env: Env = {
        SPOTIFY_CLIENT_ID: 'id',
        SPOTIFY_CLIENT_SECRET: 'secret',
        REDIRECT_URL: 'url',
        CORS_ALLOWED_ORIGINS: '',
        ASSETS: {} as Fetcher
      };

      const origins = getAllowedCorsOrigins(env);

      expect(origins).toEqual([]);
    });

    it('parses single origin', () => {
      const env: Env = {
        SPOTIFY_CLIENT_ID: 'id',
        SPOTIFY_CLIENT_SECRET: 'secret',
        REDIRECT_URL: 'url',
        CORS_ALLOWED_ORIGINS: 'https://example.com',
        ASSETS: {} as Fetcher
      };

      const origins = getAllowedCorsOrigins(env);

      expect(origins).toEqual(['https://example.com']);
    });

    it('parses multiple origins', () => {
      const env: Env = {
        SPOTIFY_CLIENT_ID: 'id',
        SPOTIFY_CLIENT_SECRET: 'secret',
        REDIRECT_URL: 'url',
        CORS_ALLOWED_ORIGINS: 'https://example.com,https://test.com,https://app.example.com',
        ASSETS: {} as Fetcher
      };

      const origins = getAllowedCorsOrigins(env);

      expect(origins).toEqual(['https://example.com', 'https://test.com', 'https://app.example.com']);
    });

    it('trims whitespace from origins', () => {
      const env: Env = {
        SPOTIFY_CLIENT_ID: 'id',
        SPOTIFY_CLIENT_SECRET: 'secret',
        REDIRECT_URL: 'url',
        CORS_ALLOWED_ORIGINS: ' https://example.com , https://test.com ',
        ASSETS: {} as Fetcher
      };

      const origins = getAllowedCorsOrigins(env);

      expect(origins).toEqual(['https://example.com', 'https://test.com']);
    });

    it('filters out empty origins', () => {
      const env: Env = {
        SPOTIFY_CLIENT_ID: 'id',
        SPOTIFY_CLIENT_SECRET: 'secret',
        REDIRECT_URL: 'url',
        CORS_ALLOWED_ORIGINS: 'https://example.com,,https://test.com',
        ASSETS: {} as Fetcher
      };

      const origins = getAllowedCorsOrigins(env);

      expect(origins).toEqual(['https://example.com', 'https://test.com']);
    });
  });
});
