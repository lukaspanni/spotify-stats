# Implementation Guide: Spotify Recommendations Feature

## Overview

This guide provides detailed technical specifications for implementing music recommendations using the Spotify Web API. It complements the research findings in `RECOMMENDATION_RESEARCH.md`.

## API Endpoint Details

### 1. Get Recommendations

**Endpoint**: `GET https://api.spotify.com/v1/recommendations`

**Authentication**: Bearer token (OAuth 2.0)

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `seed_artists` | string | conditional* | Comma-separated list of Spotify artist IDs |
| `seed_tracks` | string | conditional* | Comma-separated list of Spotify track IDs |
| `seed_genres` | string | conditional* | Comma-separated list of genre names |
| `limit` | integer | optional | Number of results (1-100, default: 20) |
| `market` | string | optional | ISO 3166-1 alpha-2 country code |

*Note: At least one seed parameter required. Maximum 5 seeds total across all types.

**Tunable Track Attributes**: Over 30 optional parameters including min/max/target values for:
- Acousticness, Danceability, Energy, Instrumentalness
- Key, Liveness, Loudness, Mode
- Popularity, Speechiness, Tempo, Time Signature, Valence

See full documentation for complete list of tunable attributes.

**Example Request**:
```http
GET https://api.spotify.com/v1/recommendations?seed_artists=4NHQUGzhtTLFvgF5SZesLK&seed_tracks=0c6xIDDpzE81m2q797ordA&limit=20
Authorization: Bearer {access_token}
```

### 2. Get Available Genre Seeds

**Endpoint**: `GET https://api.spotify.com/v1/recommendations/available-genre-seeds`

Returns list of 100+ genre seeds supported by Spotify (e.g., "acoustic", "indie", "rock", "hip-hop", etc.)

### 3. Get Audio Features

**Endpoint**: `GET https://api.spotify.com/v1/audio-features/{id}`

Get detailed audio analysis for tracks including acousticness, danceability, energy, tempo, valence, and more.

**Batch Endpoint**: `GET https://api.spotify.com/v1/audio-features?ids={ids}` (max 100 tracks)

### 4. Get Related Artists

**Endpoint**: `GET https://api.spotify.com/v1/artists/{id}/related-artists`

Returns up to 20 similar artists based on Spotify's collaborative filtering.

## Code Implementation Strategy

### TypeScript Interface Extensions

Add to `public/top-lists-client.ts`:

```typescript
export interface RecommendationParameters {
  limit?: number;
  market?: string;
  seed_artists?: string[];
  seed_tracks?: string[];
  seed_genres?: string[];
  target_energy?: number;
  target_danceability?: number;
  // ... other tunable attributes
}

export interface RecommendationsResponse {
  seeds: Array<{
    id: string;
    type: 'ARTIST' | 'TRACK' | 'GENRE';
    href: string;
  }>;
  tracks: Track[];
}

export interface TopListsClient {
  // ... existing methods
  getRecommendations(params: RecommendationParameters): Promise<RecommendationsResponse>;
  getAvailableGenreSeeds(): Promise<{ genres: string[] }>;
  getAudioFeatures(trackId: string): Promise<AudioFeatures | null>;
  getRelatedArtists(artistId: string): Promise<TopArtistsResponse>;
}
```

### Example Usage

```typescript
// Basic recommendations from top tracks
const topTracks = await client.getTopTracks('short_term', 5);
const recommendations = await client.getRecommendations({
  seed_tracks: topTracks.items.map(t => t.id).slice(0, 5),
  limit: 20
});

// Genre-based discovery
const { genres } = await client.getAvailableGenreSeeds();
const recommendations = await client.getRecommendations({
  seed_genres: ['indie', 'alternative', 'rock'],
  target_popularity: 50,
  limit: 30
});

// Audio feature matching
const audioFeatures = await client.getAudioFeaturesMultiple(trackIds);
const avgEnergy = audioFeatures.reduce((sum, f) => sum + f.energy, 0) / audioFeatures.length;
const recommendations = await client.getRecommendations({
  seed_tracks: trackIds.slice(0, 3),
  target_energy: avgEnergy,
  limit: 20
});
```

## UI Component Structure

### Recommended Components

1. **RecommendationsSection**: Main component displaying recommendations
2. **RecommendationControls**: UI for adjusting recommendation parameters
3. **AudioFeatureSliders**: Sliders for tuning energy, danceability, etc.
4. **GenreSelector**: Multi-select for genre filtering

### Example Component

```tsx
export const RecommendationsSection: React.FC<Props> = ({ client, timeRange }) => {
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  
  const loadRecommendations = async () => {
    const topTracks = await client.getTopTracks(timeRange, 5);
    const recs = await client.getRecommendations({
      seed_tracks: topTracks.items.map(t => t.id).slice(0, 5),
      limit: 20
    });
    setRecommendations(recs);
  };
  
  // ... render track cards
};
```

## Implementation Phases

### Phase 1: Basic Recommendations (Minimal)
- Add recommendation methods to client interface
- Implement seed-based recommendations
- Create basic UI component
- Use top tracks/artists as seeds

### Phase 2: Enhanced Features
- Add audio feature analysis
- Implement customization controls
- Add genre filtering
- Show recommendation reasons

### Phase 3: Advanced (Optional)
- Related artists discovery
- Recommendation history
- Multi-source recommendations
- User feedback integration

## Key Benefits

✅ **No additional OAuth scopes required** - Works with existing authentication  
✅ **Native Spotify integration** - High-quality, industry-leading algorithms  
✅ **Easy implementation** - Minimal code changes needed  
✅ **Free** - Included with Spotify Web API  
✅ **Highly customizable** - 30+ tunable parameters  

## Testing

```typescript
describe('Recommendations', () => {
  it('validates seed requirements', async () => {
    await expect(client.getRecommendations({}))
      .rejects.toThrow('At least one seed required');
  });
  
  it('enforces 5 seed maximum', async () => {
    await expect(client.getRecommendations({
      seed_tracks: ['1', '2', '3', '4', '5', '6']
    })).rejects.toThrow('Maximum 5 seeds');
  });
});
```

## Performance Considerations

- Cache genre seeds (rarely change)
- Use batch audio features endpoint
- Lazy load recommendations on-demand
- Implement rate limiting and exponential backoff
- Consider pagination for large result sets

## Next Steps

1. Review research findings in `RECOMMENDATION_RESEARCH.md`
2. Add TypeScript types and Zod schemas
3. Implement client methods in `DefaultTopListsClient`
4. Create React UI components
5. Write unit tests
6. Deploy and gather user feedback

For complete API specifications, code examples, and detailed implementation guide, see the full documentation in this repository.
