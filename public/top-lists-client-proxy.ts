import { DefaultTopListsClient } from './default-top-lists-client';
import { TimeRange, TopArtistsResponse, TopListsClient, TopTracksResponse } from './top-lists-client';

export class TopListsClientProxy implements TopListsClient {
  private client: DefaultTopListsClient;
  private cache: Map<string, TopArtistsResponse | TopTracksResponse> = new Map();

  constructor(accessToken?: string) {
    this.client = new DefaultTopListsClient(accessToken);
  }

  public async getTopArtists(
    timeRange: TimeRange,
    limit?: number | undefined,
    offset?: number | undefined
  ): Promise<TopArtistsResponse> {
    const cacheKey = `artists-${timeRange}-${limit}-${offset}`;
    if (this.cache.has(cacheKey)) return Promise.resolve(this.cache.get(cacheKey) as TopArtistsResponse);
    const result = await this.client.getTopArtists(timeRange, limit, offset);
    this.cache.set(cacheKey, result);
    return result;
  }

  public async getTopTracks(
    timeRange: TimeRange,
    limit?: number | undefined,
    offset?: number | undefined
  ): Promise<TopTracksResponse> {
    const cacheKey = `tracks-${timeRange}-${limit}-${offset}`;
    if (this.cache.has(cacheKey)) return Promise.resolve(this.cache.get(cacheKey) as TopTracksResponse);
    const result = await this.client.getTopTracks(timeRange, limit, offset);
    this.cache.set(cacheKey, result);
    return result;
  }
}
