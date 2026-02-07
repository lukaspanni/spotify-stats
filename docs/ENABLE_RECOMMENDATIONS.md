# How to Enable Spotify Recommendations Feature

## Quick Start

The Spotify recommendations feature is already implemented and ready to use. To enable it:

### 1. Enable the Feature Flag

Edit `wrangler.toml`:

```toml
[vars]
ENABLE_RECOMMENDATIONS = "true"  # Change from "false" to "true"
```

### 2. Deploy

```bash
# Build the frontend
npm run build:frontend

# Deploy to Cloudflare Workers
npm run deploy
```

### 3. Verify

After deployment, the recommendations section should appear in the UI below your top tracks and artists.

## Feature Overview

Once enabled, users can:
- ✅ Select up to 5+ favorite tracks as seeds
- ✅ Get personalized track recommendations
- ✅ Refresh recommendations with different seeds
- ✅ Create playlists from recommendations

## Technical Details

### API Endpoint Used

```
GET https://api.spotify.com/v1/recommendations
```

### Implementation Files

- **Backend**: Feature flag in `/src/handlers.ts` (line 27)
- **Frontend Client**: `/public/default-top-lists-client.ts` (lines 52-165)
- **UI Components**: 
  - `/public/components/RecommendationsSection.tsx`
  - `/public/components/SeedTrackSelector.tsx`

### Feature Flag Flow

1. Backend reads `ENABLE_RECOMMENDATIONS` from environment
2. `/api/feature-flags` endpoint returns `{ recommendations: true/false }`
3. Frontend fetches feature flags on app load
4. `RecommendationsSection` conditionally renders based on flag

### OAuth Scopes Required

✅ **No additional scopes needed!**

The recommendations API works with the same OAuth scopes already used for:
- `user-top-read` (for top tracks/artists)
- `playlist-modify-private` (for playlist creation)

## Testing Locally

### 1. Set Environment Variable

```bash
export ENABLE_RECOMMENDATIONS=true
```

### 2. Run Dev Server

```bash
npm run dev
```

### 3. Test in Browser

Navigate to `http://localhost:8787` and log in with Spotify.

## Monitoring

### Health Check

Monitor the feature flag endpoint:

```bash
curl http://your-app-domain/api/feature-flags
```

Expected response:
```json
{
  "recommendations": true
}
```

### API Errors

If the Spotify API is unavailable, the app will:
1. Try direct Spotify API call
2. Fall back to proxy endpoint (`/proxy-api/`)
3. Show error message to user if both fail

### Logs

Check Cloudflare Workers logs for any API errors:
- 401: Authentication issue (shouldn't happen with valid tokens)
- 403: Permission issue (check OAuth scopes)
- 429: Rate limiting (implement backoff)
- 404: Endpoint not found (would indicate deprecation)

## Troubleshooting

### Issue: Recommendations section not appearing

**Check**:
1. Feature flag is set to `"true"` (not `true` without quotes)
2. App has been redeployed after changing the flag
3. Browser cache cleared
4. Check browser console for errors

### Issue: "At least one seed is required" error

**Cause**: User hasn't selected any tracks

**Solution**: This is expected behavior. User must select at least 1 track to get recommendations.

### Issue: API returns empty results

**Possible causes**:
- Invalid seed IDs
- Market restrictions (track not available in user's region)
- User's preferences too narrow

**Solution**: Try different seeds or remove market restrictions

## Performance Considerations

### Multiple Seeds (>5)

The implementation automatically handles more than 5 seeds by:
1. Splitting seeds into groups of 5
2. Making parallel API requests
3. Deduplicating results
4. Limiting to requested total

### Rate Limiting

Spotify enforces rate limits. The implementation includes:
- Automatic fallback to proxy
- Error handling for rate limit errors
- Request deduplication

### Caching

Consider implementing:
- Client-side caching of recommendations (e.g., 5 minutes)
- Genre seeds caching (rarely change)
- User preference caching

## Advanced Configuration

### Custom Tunable Parameters

The implementation supports tunable audio features:

```typescript
const recommendations = await client.getRecommendations({
  seed_tracks: ['id1', 'id2'],
  target_energy: 0.8,        // High energy
  target_danceability: 0.7,  // Danceable
  target_valence: 0.6,       // Positive mood
  target_popularity: 70,     // Popular tracks
  limit: 30
});
```

### Market-Specific Recommendations

```typescript
const recommendations = await client.getRecommendations({
  seed_tracks: ['id1', 'id2'],
  market: 'US',  // Only tracks available in US
  limit: 20
});
```

## Documentation

- **Feature Flags**: `/docs/FEATURE_FLAGS.md`
- **Implementation Guide**: `/docs/RECOMMENDATION_IMPLEMENTATION_GUIDE.md`
- **API Research**: `/docs/RECOMMENDATION_API_RESEARCH.md`
- **API Summary**: `/docs/API_STATUS_SUMMARY.md`

## Support

For issues or questions:
1. Check existing tests: `npm run test`
2. Review implementation: `/public/default-top-lists-client.ts`
3. Check Spotify API docs: https://developer.spotify.com/documentation/web-api/reference/get-recommendations

---

**Last Updated**: February 2026
