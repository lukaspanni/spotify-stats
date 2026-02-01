# Feature Flags

## Recommendations Feature Flag

The recommendations feature can be enabled or disabled at runtime using the `ENABLE_RECOMMENDATIONS` environment variable.

### Configuration

**Production (wrangler.toml):**
```toml
[vars]
ENABLE_RECOMMENDATIONS = "false"  # Set to "true" to enable
```

**Local Development (.dev.vars):**
```
ENABLE_RECOMMENDATIONS=true
```

### Usage

The feature flag is checked via the `/api/feature-flags` endpoint, which returns:
```json
{
  "recommendations": true
}
```

The frontend uses **TanStack Query** for robust data fetching with automatic caching:
- Feature flags are cached for 5 minutes (stale time)
- Cache is garbage collected after 10 minutes of inactivity
- Failed requests are retried once automatically
- No refetching on window focus to avoid unnecessary backend hits
- Defaults to disabled if the API call fails

The RecommendationsSection component is conditionally rendered based on the flag value.

### Deployment

To enable recommendations in production:
1. Set `ENABLE_RECOMMENDATIONS = "true"` in wrangler.toml
2. Deploy with `wrangler deploy`

Or use Cloudflare dashboard to set environment variables without redeploying.

### Testing

Feature flag tests are included in `src/test/handlers.spec.ts` covering:
- Default behavior (disabled)
- Enabled state
- CORS headers
- Non-GET request handling

### Implementation Details

**Backend:**
- `/api/feature-flags` endpoint in `src/handlers.ts`
- Environment variable checked at runtime

**Frontend:**
- `useFeatureFlags` hook in `public/hooks/useFeatureFlags.ts`
- TanStack Query client configured in `public/query-client.ts`
- QueryClientProvider wraps the App component
- Automatic caching prevents redundant API calls
