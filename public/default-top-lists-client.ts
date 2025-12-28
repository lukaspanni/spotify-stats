import {
  TimeRange,
  TopArtistsResponse,
  TopListsClient,
  TopTracksResponse,
  CreatePlaylistResponse
} from './top-lists-client';

export class DefaultTopListsClient implements TopListsClient {
  private static baseUrl = 'https://api.spotify.com/v1/';
  private static proxyBaseUrl = '/proxy-api/';
  private topArtistsUrl = DefaultTopListsClient.baseUrl + 'me/top/artists';
  private topTracksUrl = DefaultTopListsClient.baseUrl + 'me/top/tracks';
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
    return (
      (await this.wrapCall(() =>
        this.fetchTopData<TopArtistsResponse>(this.topArtistsUrl, timeRange, limit, offset)
      )) ?? ({ items: [], total: 0 } as TopArtistsResponse)
    );
  }

  public async getTopTracks(timeRange: TimeRange, limit: number = 10, offset: number = 0): Promise<TopTracksResponse> {
    return (
      (await this.wrapCall(() => this.fetchTopData<TopTracksResponse>(this.topTracksUrl, timeRange, limit, offset))) ??
      ({ items: [], total: 0 } as TopTracksResponse)
    );
  }

  public async createPlaylist(name: string, trackUris: string[]): Promise<CreatePlaylistResponse | null> {
    try {
      // First, get the user's Spotify ID
      const userUrl = this.proxyActive
        ? DefaultTopListsClient.proxyBaseUrl + 'me'
        : DefaultTopListsClient.baseUrl + 'me';
      const userResponse = await fetch(userUrl, {
        mode: 'cors',
        headers: { Authorization: 'Bearer ' + this.accessToken }
      });

      if (!userResponse.ok) {
        console.error('Failed to get user ID');
        return null;
      }

      const userData = await userResponse.json();
      const userId = userData.id;

      // Create the playlist
      const createPlaylistUrl = this.proxyActive
        ? `${DefaultTopListsClient.proxyBaseUrl}users/${userId}/playlists`
        : `${DefaultTopListsClient.baseUrl}users/${userId}/playlists`;

      const createResponse = await fetch(createPlaylistUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          Authorization: 'Bearer ' + this.accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          description: 'Created by Spotify Stats',
          public: false
        })
      });

      if (!createResponse.ok) {
        console.error('Failed to create playlist');
        return null;
      }

      const playlistData = await createResponse.json();

      // Add tracks to the playlist
      const addTracksUrl = this.proxyActive
        ? `${DefaultTopListsClient.proxyBaseUrl}playlists/${playlistData.id}/tracks`
        : `${DefaultTopListsClient.baseUrl}playlists/${playlistData.id}/tracks`;

      const addTracksResponse = await fetch(addTracksUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          Authorization: 'Bearer ' + this.accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: trackUris
        })
      });

      if (!addTracksResponse.ok) {
        console.error('Failed to add tracks to playlist');
        return null;
      }

      return {
        id: playlistData.id,
        external_urls: playlistData.external_urls
      };
    } catch (error) {
      console.error('Error creating playlist:', error);
      return null;
    }
  }

  private async wrapCall<T>(functionCall: () => Promise<T | undefined>): Promise<T | undefined> {
    return functionCall().catch(async (error) => {
      console.error('Error fetching data, switching to proxy', error);
      this.switchToProxyFallback();
      return functionCall().catch((error) => {
        console.error('Error fetching data with proxy, aborting', error);
        this.fatalError = true;
        return undefined;
      });
    });
  }

  private switchToProxyFallback(): void {
    if (this.proxyActive) return;
    this.topArtistsUrl = DefaultTopListsClient.proxyBaseUrl + 'me/top/artists';
    this.topTracksUrl = DefaultTopListsClient.proxyBaseUrl + 'me/top/tracks';
    this.proxyActive = true;
  }

  private async fetchTopData<T>(
    url: string,
    timeRange: TimeRange,
    limit: number = 10,
    offset: number = 0
  ): Promise<T | undefined> {
    if (limit < 0) limit = 0;
    if (offset < 0) offset = 0;
    if (offset > 49) offset = 49;
    if (offset + limit > 50) limit = 50 - offset;

    const result = await fetch(`${url}?limit=${limit}&offset=${offset}&time_range=${timeRange}`, {
      mode: 'cors',
      headers: { Authorization: 'Bearer ' + this.accessToken }
    });

    return await result.json();
  }
}
