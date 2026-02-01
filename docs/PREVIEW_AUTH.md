# Preview URLs Authentication

This document explains how to use authentication on preview deployments and localhost environments.

## Problem

The Spotify OAuth flow requires a fixed redirect URI configured in the Spotify Developer Dashboard. This means:
- Preview deployments (e.g., `*-spotify-stats.lupanni-lp.workers.dev`) cannot use OAuth
- Local development environments (`localhost`) cannot use OAuth
- Only the production URL can authenticate via the standard flow

## Solution

We've added a simple manual token paste flow that allows you to authenticate on preview/local environments by extracting tokens from the production app's browser cookies and pasting them.

## How It Works

### 1. On Production (Main App)

When you're authenticated on the main application:
1. Open browser DevTools (F12)
2. Navigate to **Application** → **Cookies** (Chrome) or **Storage** → **Cookies** (Firefox)
3. Find the `accessToken` cookie
4. Copy the cookie value (it's a JSON string)
5. Parse the JSON to extract the `token` and `refreshToken` fields

### 2. On Preview/Localhost

When you open the app on a preview URL or localhost:
1. The app will automatically detect you're on a preview/local environment
2. Instead of the normal OAuth button, you'll see a **"Token Paste"** form
3. Paste the **Access Token** (the `token` field from the cookie JSON)
4. Paste the **Refresh Token** (the `refreshToken` field from the cookie JSON)
5. Click **"Set Tokens"** to authenticate

The app will set the appropriate cookies and reload, giving you full access.

## Technical Details

### Backend Endpoint

#### `POST /api/set-tokens`
Accepts manually pasted tokens and sets authentication cookies.

**Request:**
```json
{
  "accessToken": "BQD...",
  "refreshToken": "AQD...",
  "expires": 1234567890 // optional, defaults to 1 hour from now
}
```

**Response:**
```json
{
  "success": true
}
```

### Frontend Components

- **`TokenPasteView`**: Form for pasting tokens on preview/local environments
- **Environment Detection**: Automatically detects preview URLs (contains `lupanni-lp.workers.dev`) and localhost

### Token Refresh

The refresh token flow (`/refresh-token` endpoint) works the same way regardless of how you authenticated (OAuth or manual token paste). When your access token expires, the app will automatically use the refresh token to get a new access token.

## Security Considerations

- Tokens are stored in HttpOnly cookies for security
- The token paste UI is only shown on non-production environments
- Tokens have the same lifetime and security as OAuth-obtained tokens
- Never share your tokens with anyone

## Development

To test this feature locally:

1. Deploy to a preview URL or run locally with `pnpm run dev`
2. Open the production app, authenticate, and extract tokens from cookies
3. Paste the tokens into the preview/local environment
4. Verify that all features work as expected

## Configuration

The preview domain pattern is configured in `public/App.tsx`:

```typescript
const PREVIEW_DOMAIN_PATTERN = 'lupanni-lp.workers.dev';
```

Update this constant if your preview URLs use a different domain pattern.
