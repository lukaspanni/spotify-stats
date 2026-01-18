# Spotify Stats

## Cloudflare Workers backend

The backend routes are implemented for Cloudflare Workers and handle:

- `/login`
- `/spotify-callback`
- `/refresh-token`
- `/proxy-api/*` (Spotify API proxy)

### Cloudflare Workers setup

1. Install the Cloudflare Wrangler CLI (choose one):
   - `npm install -D wrangler`
   - `npm install -g wrangler`
2. Authenticate Wrangler:
   - `npx wrangler login`
3. Configure environment variables for the worker:
   - `npx wrangler secret put SPOTIFY_CLIENT_ID`
   - `npx wrangler secret put SPOTIFY_CLIENT_SECRET`
   - `npx wrangler secret put REDIRECT_URL`
   - Optional: `npx wrangler secret put CORS_ALLOWED_ORIGINS` (comma-separated list of additional trusted origins)

   `REDIRECT_URL` must be the full URL to `/spotify-callback`, for example:
   `https://your-worker.example.com/spotify-callback`.
4. Update the Spotify application settings so the redirect URI matches `REDIRECT_URL`.
5. Run the worker locally:
   - `npx wrangler dev`
6. Deploy the worker:
   - `npx wrangler deploy`

### Frontend hosting

The frontend can be hosted separately (for example, Cloudflare Pages). To avoid CORS issues,
serve the frontend from the same origin as the worker or ensure requests go through
the `/proxy-api/*` route on the worker domain.
