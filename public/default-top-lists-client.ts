import { TimeRange, TopArtistsResponse, TopListsClient, TopTracksResponse } from './top-lists-client';

export class DefaultTopListsClient implements TopListsClient {
  private static baseUrl = 'https://api.spotify.com/v1/me/top/';
  private static topArtistsUrl = DefaultTopListsClient.baseUrl + 'artists';
  private static topTracksUrl = DefaultTopListsClient.baseUrl + 'tracks';

  private accessToken: string;

  constructor(accessToken?: string) {
    if (accessToken == null || accessToken == '') {
      throw new Error('accessToken is null or empty');
    }
    this.accessToken = accessToken;
  }

  public async getTopArtists(
    timeRange: TimeRange,
    limit: number = 10,
    offset: number = 0
  ): Promise<TopArtistsResponse> {
    return (
      (await this.fetchTopData<TopArtistsResponse>(DefaultTopListsClient.topArtistsUrl, timeRange, limit, offset)) ??
      ({ items: [], total: 0 } as TopArtistsResponse)
    );
  }

  public async getTopTracks(timeRange: TimeRange, limit: number = 10, offset: number = 0): Promise<TopTracksResponse> {
    return (
      (await this.fetchTopData<TopTracksResponse>(DefaultTopListsClient.topTracksUrl, timeRange, limit, offset)) ??
      ({ items: [], total: 0 } as TopTracksResponse)
    );
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
