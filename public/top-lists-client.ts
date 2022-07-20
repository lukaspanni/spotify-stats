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

export interface TopListsClient {
  getTopArtists(timeRange: TimeRange, limit?: number, offset?: number): Promise<TopArtistsResponse>;
  getTopTracks(timeRange: TimeRange, limit?: number, offset?: number): Promise<TopTracksResponse>;
}
