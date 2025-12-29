import {
  TimeRange,
  TopArtistsResponse,
  TopListsClient,
  TopTracksResponse,
  CreatePlaylistResponse,
  UserProfile,
  schemas
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

    const url = this.buildUrl(path);
    const result = await this.fetchWithFallback(url, path, fetchOptions, schema);
    return result;
  }

  private async fetchWithFallback<T>(
    url: string,
    path: string,
    fetchOptions: RequestInit,
    schema: { parse: (data: unknown) => T }
  ): Promise<T | undefined> {
    try {
      const response = await fetch(url, fetchOptions);
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
