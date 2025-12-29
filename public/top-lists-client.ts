import { z } from 'zod';

// Zod schemas for API responses
const ImageSchema = z.object({
  url: z.string(),
  height: z.number(),
  width: z.number()
});

const SpotifyTopListElementSchema = z.object({
  name: z.string(),
  external_urls: z.object({ spotify: z.string() }),
  id: z.string(),
  popularity: z.number()
});

const ArtistSchema = SpotifyTopListElementSchema.extend({
  genres: z.array(z.string()),
  images: z.array(ImageSchema)
});

const TrackSchema = SpotifyTopListElementSchema.extend({
  artists: z.array(ArtistSchema),
  album: z.object({
    name: z.string(),
    images: z.array(ImageSchema)
  })
});

const TopArtistsResponseSchema = z.object({
  items: z.array(ArtistSchema),
  total: z.number()
});

const TopTracksResponseSchema = z.object({
  items: z.array(TrackSchema),
  total: z.number()
});

const CreatePlaylistResponseSchema = z.object({
  id: z.string(),
  external_urls: z.object({ spotify: z.string() }),
  snapshot_id: z.string().optional()
});

const UserProfileSchema = z.object({
  id: z.string()
});

// Infer types from schemas
export type Image = z.infer<typeof ImageSchema>;
export type SpotifyTopListElement = z.infer<typeof SpotifyTopListElementSchema>;
export type Artist = z.infer<typeof ArtistSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type TopArtistsResponse = z.infer<typeof TopArtistsResponseSchema>;
export type TopTracksResponse = z.infer<typeof TopTracksResponseSchema>;
export type CreatePlaylistResponse = z.infer<typeof CreatePlaylistResponseSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

// Export schemas for use in validation
export const schemas = {
  Image: ImageSchema,
  Artist: ArtistSchema,
  Track: TrackSchema,
  TopArtistsResponse: TopArtistsResponseSchema,
  TopTracksResponse: TopTracksResponseSchema,
  CreatePlaylistResponse: CreatePlaylistResponseSchema,
  UserProfile: UserProfileSchema
};

export interface TopListsClient {
  getTopArtists(timeRange: TimeRange, limit?: number, offset?: number): Promise<TopArtistsResponse>;
  getTopTracks(timeRange: TimeRange, limit?: number, offset?: number): Promise<TopTracksResponse>;
  createPlaylist(name: string, trackUris: string[]): Promise<CreatePlaylistResponse | null>;
}
