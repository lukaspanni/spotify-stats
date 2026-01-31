import {
  TimeRange,
  TopArtistsResponse,
  TopListsClient,
  TopTracksResponse,
  CreatePlaylistResponse,
  UserProfile,
  schemas,
  RecommendationParameters,
  RecommendationsResponse,
  AvailableGenreSeedsResponse
} from './top-lists-client';

export class DefaultTopListsClient implements TopListsClient {
  private static baseUrl = 'https://api.spotify.com/v1/';
  private static proxyBaseUrl = '/proxy-api/';
  private proxyActive = false;
  private fatalError = false;

  private accessToken: string;

  constructor(accessToken?: string) {
    if (accessToken == null || accessToken === '') throw new Error('accessToken is null or empty');

    this.accessToken = accessToken;
  }

  public async getTopArtists(
    timeRange: TimeRange,
    limit: number = 10,
    offset: number = 0
  ): Promise<TopArtistsResponse> {
    const result = await this.makeRequest<TopArtistsResponse>(
      `me/top/artists?limit=${limit}&offset=${offset}&time_range=${timeRange}`,
      schemas.TopArtistsResponse
    );
    return result ?? { items: [], total: 0 };
  }

  public async getTopTracks(timeRange: TimeRange, limit: number = 10, offset: number = 0): Promise<TopTracksResponse> {
    const result = await this.makeRequest<TopTracksResponse>(
      `me/top/tracks?limit=${limit}&offset=${offset}&time_range=${timeRange}`,
      schemas.TopTracksResponse
    );
    return result ?? { items: [], total: 0 };
  }

  public async createPlaylist(name: string, trackUris: string[]): Promise<CreatePlaylistResponse | null> {
    return this.createPlaylistInternal(name, trackUris);
  }

  public async getRecommendations(params: RecommendationParameters): Promise<RecommendationsResponse> {
    // Validate that at least one seed is provided
    const totalSeeds =
      (params.seed_artists?.length || 0) + (params.seed_tracks?.length || 0) + (params.seed_genres?.length || 0);

    if (totalSeeds === 0) throw new Error('At least one seed (artist, track, or genre) is required');

    // If we have 5 or fewer seeds, make a single request
    const seedTracks = params.seed_tracks || [];
    const seedArtists = params.seed_artists || [];
    const seedGenres = params.seed_genres || [];

    if (totalSeeds <= 5) return this.makeRecommendationRequest(params);

    // Handle more than 5 seed tracks by making multiple requests with different combinations
    // We'll focus on seed_tracks since that's mentioned in the requirements
    if (seedTracks.length > 5) return this.getRecommendationsWithMultipleSeeds(params);

    // If we have more than 5 seeds but they're mixed types, just use the first 5
    const limitedParams: RecommendationParameters = {
      ...params,
      seed_artists: seedArtists.slice(0, Math.min(5, seedArtists.length)),
      seed_tracks: seedTracks.slice(0, Math.max(0, 5 - seedArtists.length)),
      seed_genres: seedGenres.slice(0, Math.max(0, 5 - seedArtists.length - seedTracks.length))
    };

    return this.makeRecommendationRequest(limitedParams);
  }

  public async getAvailableGenreSeeds(): Promise<AvailableGenreSeedsResponse> {
    const result = await this.makeRequest<AvailableGenreSeedsResponse>(
      'recommendations/available-genre-seeds',
      schemas.AvailableGenreSeedsResponse
    );
    return result ?? { genres: [] };
  }

  private async getRecommendationsWithMultipleSeeds(
    params: RecommendationParameters
  ): Promise<RecommendationsResponse> {
    const seedTracks = params.seed_tracks || [];
    const requestLimit = params.limit || 20;
    const tracksPerRequest = Math.ceil(requestLimit / Math.ceil(seedTracks.length / 5));

    // Split seed tracks into groups of 5
    const seedGroups: string[][] = [];
    for (let i = 0; i < seedTracks.length; i += 5) seedGroups.push(seedTracks.slice(i, i + 5));

    // Make multiple requests with different seed combinations
    const requests = seedGroups.map((seedGroup) =>
      this.makeRecommendationRequest({
        ...params,
        seed_tracks: seedGroup,
        seed_artists: undefined, // Clear other seeds when using multiple track seeds
        seed_genres: undefined,
        limit: Math.min(tracksPerRequest, 100)
      })
    );

    const results = await Promise.all(requests);

    // Combine results and deduplicate tracks
    const allTracks = results.flatMap((r) => r.tracks);
    const uniqueTracks = allTracks.filter((track, index, self) => self.findIndex((t) => t.id === track.id) === index);

    // Limit to requested amount
    const limitedTracks = uniqueTracks.slice(0, requestLimit);

    return {
      seeds: results.flatMap((r) => r.seeds),
      tracks: limitedTracks
    };
  }

  private async makeRecommendationRequest(params: RecommendationParameters): Promise<RecommendationsResponse> {
    const queryParams = new URLSearchParams();

    // Add seed parameters
    if (params.seed_artists?.length) queryParams.set('seed_artists', params.seed_artists.slice(0, 5).join(','));

    if (params.seed_tracks?.length) queryParams.set('seed_tracks', params.seed_tracks.slice(0, 5).join(','));

    if (params.seed_genres?.length) queryParams.set('seed_genres', params.seed_genres.slice(0, 5).join(','));

    // Add optional parameters
    if (params.limit !== undefined) queryParams.set('limit', Math.min(params.limit, 100).toString());

    if (params.market) queryParams.set('market', params.market);

    if (params.target_energy !== undefined) queryParams.set('target_energy', params.target_energy.toString());

    if (params.target_danceability !== undefined)
      queryParams.set('target_danceability', params.target_danceability.toString());

    if (params.target_valence !== undefined) queryParams.set('target_valence', params.target_valence.toString());

    if (params.target_popularity !== undefined)
      queryParams.set('target_popularity', params.target_popularity.toString());

    const result = await this.makeRequest<RecommendationsResponse>(
      `recommendations?${queryParams}`,
      schemas.RecommendationsResponse
    );

    return result ?? { seeds: [], tracks: [] };
  }

  private buildUrl(path: string): string {
    const base = this.proxyActive ? DefaultTopListsClient.proxyBaseUrl : DefaultTopListsClient.baseUrl;
    return `${base}${path}`;
  }

  private async makeRequest<T>(
    path: string,
    schema: { parse: (data: unknown) => T },
    options?: RequestInit
  ): Promise<T | undefined> {
    const fetchOptions: RequestInit = {
      mode: 'cors',
      headers: { Authorization: 'Bearer ' + this.accessToken },
      ...options
    };

    return this.fetchWithFallback(path, fetchOptions, schema);
  }

  private async fetchWithFallback<T>(
    path: string,
    fetchOptions: RequestInit,
    schema: { parse: (data: unknown) => T }
  ): Promise<T | undefined> {
    const url = this.buildUrl(path);

    try {
      const response = await fetch(url, fetchOptions);
      if (response.status === 403) {
        // Insufficient permissions - redirect to re-authorize
        console.error('Authorization failed - insufficient permissions. Redirecting to login...');
        window.location.href = '/login';
        return undefined;
      }
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json();
      return schema.parse(data);
    } catch (error) {
      if (this.proxyActive) {
        console.error('Request failed', error);
        return undefined;
      }

      console.error('Error fetching data, switching to proxy', error);
      this.proxyActive = true;
      const proxyUrl = this.buildUrl(path);

      try {
        const response = await fetch(proxyUrl, fetchOptions);
        if (response.status === 403) {
          // Insufficient permissions - redirect to re-authorize
          console.error('Authorization failed - insufficient permissions. Redirecting to login...');
          window.location.href = '/login';
          return undefined;
        }
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const data = await response.json();
        return schema.parse(data);
      } catch (retryError) {
        console.error('Error fetching data with proxy, aborting', retryError);
        this.fatalError = true;
        return undefined;
      }
    }
  }

  private async createPlaylistInternal(name: string, trackUris: string[]): Promise<CreatePlaylistResponse | null> {
    try {
      // First, get the user's Spotify ID
      const userResponse = await this.makeRequest<UserProfile>('me', schemas.UserProfile);

      if (!userResponse?.id?.trim()) {
        console.error('User ID is missing or invalid in user profile response');
        return null;
      }

      const userId = userResponse.id;

      // Create the playlist
      const createOptions: RequestInit = {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + this.accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          description: 'Created by Spotify Stats',
          public: false
        })
      };

      const playlistData = await this.makeRequest<CreatePlaylistResponse>(
        `users/${userId}/playlists`,
        schemas.CreatePlaylistResponse,
        createOptions
      );

      if (!playlistData) {
        console.error('Failed to create playlist');
        return null;
      }

      // Add tracks to the playlist in batches of 100 (Spotify API limit)
      const batchSize = 100;
      for (let i = 0; i < trackUris.length; i += batchSize) {
        const batch = trackUris.slice(i, i + batchSize);

        const addTracksOptions: RequestInit = {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + this.accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: batch
          })
        };

        const addTracksUrl = this.buildUrl(`playlists/${playlistData.id}/tracks`);
        try {
          const response = await fetch(addTracksUrl, addTracksOptions);
          if (response.status === 403) {
            console.error('Authorization failed - insufficient permissions. Redirecting to login...');
            window.location.href = '/login';
            return null;
          }
          if (!response.ok) console.error(`Failed to add tracks batch ${i / batchSize + 1} to playlist`);
        } catch (error) {
          console.error(`Error adding tracks batch ${i / batchSize + 1}:`, error);
        }
      }

      // Return the playlist data even if some batches failed
      return playlistData;
    } catch (error) {
      console.error('Error creating playlist:', error);
      return null;
    }
  }
}
