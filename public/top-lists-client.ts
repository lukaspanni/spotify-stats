import { Artist, Track } from './spotify-types';

export type TopArtistsResponse = { items: Artist[]; total: number };
export type TopTracksResponse = { items: Track[]; total: number };

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export interface TopListsClient {
  getTopArtists(timeRange: TimeRange, limit?: number, offset?: number): Promise<TopArtistsResponse>;
  getTopTracks(timeRange: TimeRange, limit?: number, offset?: number): Promise<TopTracksResponse>;
}
