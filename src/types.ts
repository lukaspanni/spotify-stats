export type AccessToken = { token: string; expires: number; refreshToken?: string };

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

export type Env = {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  REDIRECT_URL: string;
  CORS_ALLOWED_ORIGINS?: string;
};

export type CookieOptions = {
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
};

export type EnvConfig = { clientId: string; clientSecret: string; redirectUrl: string };
