# Research: Options for Implementing Music Recommendations

## Executive Summary

This document outlines research findings on implementing music recommendations in the Spotify Stats application. The research focuses on Spotify Web API capabilities and alternative free APIs that can be used to provide personalized music recommendations based on user listening history.

## Current Application State

### Existing Spotify API Integration

The application currently uses the following Spotify Web API endpoints:

1. **Authentication & Authorization**
   - OAuth 2.0 flow with authorization code grant
   - Token refresh mechanism
   - Current scopes: `user-read-private user-read-email user-top-read playlist-modify-public playlist-modify-private`

2. **Active Endpoints**
   - `GET /v1/me/top/artists` - Get user's top artists
   - `GET /v1/me/top/tracks` - Get user's top tracks  
   - `GET /v1/me` - Get current user profile
   - `POST /v1/users/{user_id}/playlists` - Create playlist
   - `POST /v1/playlists/{playlist_id}/tracks` - Add tracks to playlist

3. **Time Range Support**
   - `short_term` - Last 4 weeks
   - `medium_term` - Last 6 months
   - `long_term` - All time data

## Spotify Web API Recommendation Options

### 1. Get Recommendations Endpoint

**Endpoint**: `GET /v1/recommendations`

**Description**: Get personalized track recommendations based on seed values (artists, tracks, or genres).

**Key Features**:
- Accepts up to 5 seed values (combined total of artists, tracks, and genres)
- Supports tunable track attributes (acousticness, danceability, energy, instrumentalness, key, liveness, loudness, mode, popularity, speechiness, tempo, time_signature, valence)
- Returns up to 100 tracks per request
- No additional OAuth scopes required (can use existing authentication)

**Request Parameters**:
- `seed_artists` - Comma-separated list of Spotify artist IDs
- `seed_tracks` - Comma-separated list of Spotify track IDs
- `seed_genres` - Comma-separated list of genre names
- `limit` - Number of recommendations (1-100, default: 20)
- `market` - ISO 3166-1 alpha-2 country code
- Tunable attributes (e.g., `target_energy`, `min_danceability`, `max_tempo`)

**Example Request**:
```
GET https://api.spotify.com/v1/recommendations?seed_artists=4NHQUGzhtTLFvgF5SZesLK&seed_tracks=0c6xIDDpzE81m2q797ordA&limit=20
```

**Response**: Returns an array of track objects similar to the top tracks response.

**Integration Strategy**:
- Can use user's top artists/tracks as seeds
- No additional OAuth scopes needed
- Easy integration with existing codebase structure

### 2. Available Genre Seeds Endpoint

**Endpoint**: `GET /v1/recommendations/available-genre-seeds`

**Description**: Retrieve a list of available genres for use as seed values in the recommendations endpoint.

**Key Features**:
- Returns complete list of genre seeds supported by Spotify
- No parameters required
- Useful for genre-based filtering and recommendations

**Example Response**:
```json
{
  "genres": [
    "acoustic",
    "afrobeat",
    "alt-rock",
    "alternative",
    "ambient",
    ...
  ]
}
```

### 3. Audio Features Endpoint

**Endpoint**: `GET /v1/audio-features/{id}` or `GET /v1/audio-features`

**Description**: Get audio features for one or multiple tracks. These features can be used to fine-tune recommendations.

**Audio Features Include**:
- Acousticness (0.0 to 1.0)
- Danceability (0.0 to 1.0)
- Energy (0.0 to 1.0)
- Instrumentalness (0.0 to 1.0)
- Liveness (0.0 to 1.0)
- Loudness (in dB)
- Speechiness (0.0 to 1.0)
- Tempo (BPM)
- Valence/Positivity (0.0 to 1.0)

**Use Case**: Analyze user's top tracks to determine preferred audio characteristics, then use these as targets for recommendations.

### 4. Related Artists Endpoint

**Endpoint**: `GET /v1/artists/{id}/related-artists`

**Description**: Get artists similar to a given artist based on analysis of the Spotify community's listening history.

**Key Features**:
- Returns up to 20 related artists
- Based on collaborative filtering
- No additional scopes required

**Use Case**: Discover new artists similar to user's favorites.

### 5. Track Search with Filters

**Endpoint**: `GET /v1/search`

**Description**: Search for tracks with genre, year, and other filters.

**Key Features**:
- Can filter by genre, year, artist
- Supports relevance-based sorting
- Can discover new releases

## Implementation Recommendations

### Recommended Approach: Multi-Strategy Recommendation System

#### Strategy 1: Seed-Based Recommendations (Primary)

**Implementation Steps**:
1. Use user's top artists and tracks as seed values
2. Call `/v1/recommendations` endpoint with top 5 items as seeds
3. Allow users to adjust recommendation parameters (energy, danceability, etc.)
4. Display recommendations in a new section or tab

**Code Structure**:
```typescript
// Add to top-lists-client.ts interface
interface TopListsClient {
  // ... existing methods
  getRecommendations(
    seedArtists?: string[],
    seedTracks?: string[],
    seedGenres?: string[],
    limit?: number,
    targetAttributes?: RecommendationAttributes
  ): Promise<RecommendationsResponse>;
  
  getAvailableGenres(): Promise<string[]>;
}

interface RecommendationAttributes {
  target_acousticness?: number;
  target_danceability?: number;
  target_energy?: number;
  target_valence?: number;
  // ... other attributes
}
```

**Advantages**:
- Uses existing authentication and infrastructure
- No additional OAuth scopes required
- Highly customizable recommendations
- Built into Spotify's platform

**Limitations**:
- Limited to 5 seeds per request
- Requires existing listening history for best results

#### Strategy 2: Related Artists Discovery (Secondary)

**Implementation Steps**:
1. For each of user's top artists, fetch related artists
2. Aggregate and deduplicate results
3. Fetch top tracks for related artists
4. Present as "Artists You Might Like"

**Advantages**:
- Simple to implement
- Good for artist discovery
- No additional scopes needed

#### Strategy 3: Audio Feature Analysis (Advanced)

**Implementation Steps**:
1. Fetch audio features for user's top tracks
2. Calculate average preferences (e.g., average energy, danceability)
3. Use these as target parameters for recommendations
4. Provide visualizations of listening preferences

**Advantages**:
- Data-driven personalization
- Provides insights into listening habits
- Can fine-tune recommendations

### UI/UX Recommendations

1. **New "Recommendations" Section**
   - Add a new tab or page for recommendations
   - Display recommended tracks in a similar card layout to top tracks
   - Include reason for recommendation (e.g., "Based on your love for Artist X")

2. **Customization Options**
   - Sliders for audio features (energy, danceability, etc.)
   - Genre filter dropdown
   - Time range selector (use different seeds based on time range)

3. **Action Buttons**
   - "Add to Playlist" functionality (already supported)
   - "Refresh Recommendations" button
   - "Like/Dislike" for feedback (future enhancement)

## Alternative Free APIs

### 1. Last.fm API

**Website**: https://www.last.fm/api

**Relevant Endpoints**:
- `track.getSimilar` - Get similar tracks
- `artist.getSimilar` - Get similar artists
- `user.getRecommendedTracks` - Get recommended tracks for a user
- `user.getRecommendedArtists` - Get recommended artists for a user

**Requirements**:
- Free API key (no payment required)
- Rate limit: Standard tier allows reasonable usage
- Requires users to have Last.fm account for user-specific recommendations

**Advantages**:
- Large music database
- Strong recommendation algorithms
- Community-driven data

**Limitations**:
- Requires separate authentication if using user-specific features
- May not have all Spotify tracks
- Additional API dependency

**Integration Complexity**: Medium - Would require mapping between Last.fm and Spotify IDs

### 2. MusicBrainz API

**Website**: https://musicbrainz.org/doc/MusicBrainz_API

**Description**: Open music encyclopedia with extensive metadata

**Limitations**:
- Focused on metadata, not recommendations
- No built-in recommendation algorithm
- Would require implementing custom recommendation logic

**Use Case**: Better suited for metadata enrichment rather than recommendations

### 3. Discogs API

**Website**: https://www.discogs.com/developers

**Description**: Database of music releases, artists, and labels

**Limitations**:
- Primarily focused on catalog data
- No recommendation endpoints
- Not suitable for this use case

### 4. AudioDB API

**Website**: https://www.theaudiodb.com/api_guide.php

**Description**: Music database with artist and album information

**Limitations**:
- Limited to metadata
- No recommendation features
- Not suitable for this use case

## Recommended Implementation Plan

### Phase 1: Basic Recommendations (Minimal Implementation)

**Scope**: Implement Spotify's recommendations endpoint with seed-based approach

1. Add new method to `TopListsClient` interface for getting recommendations
2. Implement in `DefaultTopListsClient` class
3. Add Zod schema for recommendations response
4. Create new `RecommendationsSection` React component
5. Add "Recommendations" tab/section to UI
6. Use user's top tracks and artists as seeds

**Estimated Effort**: Low
**Value**: High - Leverages existing infrastructure

### Phase 2: Enhanced Recommendations

**Scope**: Add customization and audio feature analysis

1. Implement audio features fetching
2. Add UI controls for tuning recommendations
3. Show "Why this recommendation" information
4. Implement genre filtering using available genre seeds

**Estimated Effort**: Medium
**Value**: Medium - Better user experience

### Phase 3: Advanced Features (Optional)

**Scope**: Related artists, multi-source recommendations

1. Implement related artists discovery
2. Consider Last.fm integration for additional data
3. Add recommendation history and feedback
4. Implement collaborative filtering with user data

**Estimated Effort**: High
**Value**: Medium - Nice-to-have features

## Required Changes

### 1. OAuth Scopes

**Current**: `user-read-private user-read-email user-top-read playlist-modify-public playlist-modify-private`

**Required for Recommendations**: No additional scopes needed! All recommendation endpoints work with existing authentication.

### 2. API Rate Limits

- Spotify API has rate limits that apply to all endpoints
- Recommendation calls count against the same limits
- Current implementation should handle rate limiting gracefully

### 3. Data Privacy

- Recommendations are generated server-side by Spotify
- No user data is shared with third parties
- Complies with existing privacy requirements

## Conclusion

**Primary Recommendation**: Implement Spotify Web API's recommendations endpoint as the primary solution.

**Rationale**:
1. **No Additional Scopes**: Works with existing OAuth configuration
2. **Native Integration**: Uses same API and authentication infrastructure
3. **High Quality**: Spotify's algorithms are industry-leading
4. **Easy Implementation**: Minimal code changes required
5. **No Additional Dependencies**: No third-party APIs needed
6. **Cost**: Free (included with Spotify Web API)

**Secondary Option**: Consider Last.fm API only if Spotify recommendations prove insufficient or if additional music discovery features are needed beyond Spotify's ecosystem.

**Next Steps**:
1. Create proof-of-concept implementation using Spotify recommendations endpoint
2. Test with various seed combinations and parameters
3. Design UI/UX for recommendations display
4. Implement full feature with user controls
5. Gather user feedback and iterate

## Additional Resources

- Spotify Web API Documentation: https://developer.spotify.com/documentation/web-api
- Spotify Recommendations Guide: https://developer.spotify.com/documentation/web-api/concepts/recommendations
- OAuth Scopes Reference: https://developer.spotify.com/documentation/web-api/concepts/scopes
- Audio Features Reference: https://developer.spotify.com/documentation/web-api/reference/get-audio-features
