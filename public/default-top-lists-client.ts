import { TimeRange, TopArtistsResponse, TopListsClient, TopTracksResponse } from './top-lists-client';

export class DefaultTopListsClient implements TopListsClient {
  private static baseUrl = 'https://api.spotify.com/v1/me/top/';
  private static proxyBaseUrl = '/proxy-api/me/top/';
  private topArtistsUrl = DefaultTopListsClient.baseUrl + 'artists';
  private topTracksUrl = DefaultTopListsClient.baseUrl + 'tracks';
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
    this.topArtistsUrl = DefaultTopListsClient.proxyBaseUrl + 'artists';
    this.topTracksUrl = DefaultTopListsClient.proxyBaseUrl + 'tracks';
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
