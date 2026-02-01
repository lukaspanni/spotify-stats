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

The frontend automatically fetches this endpoint on load and conditionally renders the RecommendationsSection component based on the flag value.

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
