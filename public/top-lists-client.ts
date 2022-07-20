export type Image = { url: string; height: number; width: number };
export type Artist = { name: string; genres: string[]; id: string; popularity: number; images: Image[] };
export type Track = {
  name: string;
  artists: Artist[];
  id: string;
  popularity: number;
  album: { name: string; images: Image[] };
};

export type TopArtistsResponse = { items: Artist[]; total: number };
export type TopTracksResponse = { items: Track[]; total: number };

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export class TopListsClient {
  private static baseUrl = 'https://api.spotify.com/v1/me/top/';
  private static topArtistsUrl = TopListsClient.baseUrl + 'artists';
  private static topTracksUrl = TopListsClient.baseUrl + 'tracks';
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
      (await this.fetchTopData<TopArtistsResponse>(TopListsClient.topArtistsUrl, timeRange, limit, offset)) ??
      ({ items: [], total: 0 } as TopArtistsResponse)
    );
  }

  public async getTopTracks(timeRange: TimeRange, limit: number = 10, offset: number = 0): Promise<TopTracksResponse> {
    return (
      (await this.fetchTopData<TopTracksResponse>(TopListsClient.topTracksUrl, timeRange, limit, offset)) ??
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
