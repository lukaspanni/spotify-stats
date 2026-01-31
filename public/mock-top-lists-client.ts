import {
  Artist,
  CreatePlaylistResponse,
  Image,
  TimeRange,
  TopArtistsResponse,
  TopListsClient,
  TopTracksResponse,
  Track,
  RecommendationParameters,
  RecommendationsResponse,
  AvailableGenreSeedsResponse
} from './top-lists-client';

interface MockDataSet {
  artists: Artist[];
  tracks: Track[];
}

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  short_term: 'Recent',
  medium_term: '6-Month',
  long_term: 'All-Time'
};

const GENRE_POOL = [
  ['synthwave', 'electronic'],
  ['indie pop', 'dream pop'],
  ['alternative rock', 'garage rock'],
  ['hip hop', 'lo-fi'],
  ['jazz fusion', 'neo soul'],
  ['house', 'dance'],
  ['acoustic', 'singer-songwriter'],
  ['ambient', 'chillout']
];

const TRACK_STYLE_POOL = [
  'Neon Drive',
  'City Lights',
  'Midnight Echo',
  'Golden Hour',
  'Ocean Breeze',
  'Stardust',
  'Velvet Sky',
  'Pulse Wave',
  'Crystal Rain',
  'Moonrise'
];

const ALBUM_STYLE_POOL = ['Afterglow', 'Daydream', 'Nightfall', 'Aurora', 'Atlas', 'Mirage', 'Odyssey', 'Echoes'];

const createImages = (label: string): Image[] =>
  [640, 300, 64].map((size) => ({
    url: `https://placehold.co/${size}x${size}/1DB954/ffffff/png?text=${encodeURIComponent(label)}`,
    height: size,
    width: size
  }));

const buildArtists = (timeRange: TimeRange, count: number): Artist[] =>
  Array.from({ length: count }, (_, index) => {
    const label = `${TIME_RANGE_LABELS[timeRange]} Artist ${index + 1}`;
    const genres = GENRE_POOL[index % GENRE_POOL.length] ?? [];
    return {
      id: `mock-artist-${timeRange}-${index + 1}`,
      name: label,
      external_urls: { spotify: `https://open.spotify.com/artist/mock-artist-${timeRange}-${index + 1}` },
      genres,
      images: createImages(label)
    };
  });

const buildTracks = (timeRange: TimeRange, count: number, artists: Artist[]): Track[] =>
  Array.from({ length: count }, (_, index) => {
    const name = `${TRACK_STYLE_POOL[index % TRACK_STYLE_POOL.length]} ${index + 1}`;
    const albumName = `${ALBUM_STYLE_POOL[index % ALBUM_STYLE_POOL.length]} (${TIME_RANGE_LABELS[timeRange]})`;
    const mainArtist = artists[index % artists.length];
    const featuredArtist = artists[(index + 3) % artists.length];

    return {
      id: `mock-track-${timeRange}-${index + 1}`,
      name,
      external_urls: { spotify: `https://open.spotify.com/track/mock-track-${timeRange}-${index + 1}` },
      artists: [mainArtist, featuredArtist].filter(
        (artist, artistIndex) => artistIndex === 0 || artist.id !== mainArtist.id
      ),
      album: {
        name: albumName,
        images: createImages(albumName)
      },
      popularity: 60 + (index % 40)
    };
  });

const paginate = <T>(items: T[], limit: number, offset: number): T[] => items.slice(offset, offset + limit);

export class MockTopListsClient implements TopListsClient {
  private data: Map<TimeRange, MockDataSet> = new Map();

  public async getTopArtists(
    timeRange: TimeRange,
    limit: number = 10,
    offset: number = 0
  ): Promise<TopArtistsResponse> {
    const dataset = this.getDataset(timeRange);
    return {
      items: paginate(dataset.artists, limit, offset),
      total: dataset.artists.length
    };
  }

  public async getTopTracks(timeRange: TimeRange, limit: number = 10, offset: number = 0): Promise<TopTracksResponse> {
    const dataset = this.getDataset(timeRange);
    return {
      items: paginate(dataset.tracks, limit, offset),
      total: dataset.tracks.length
    };
  }

  public async createPlaylist(name: string, trackUris: string[]): Promise<CreatePlaylistResponse | null> {
    if (!name.trim() || trackUris.length === 0) return null;

    return {
      id: `mock-playlist-${name.toLowerCase().replace(/\s+/g, '-')}`,
      external_urls: { spotify: 'https://open.spotify.com/playlist/mock-playlist' },
      snapshot_id: 'mock-snapshot'
    };
  }

  public async getRecommendations(params: RecommendationParameters): Promise<RecommendationsResponse> {
    // Generate mock recommendations based on provided seeds
    const limit = params.limit || 20;
    const mockTracks = buildTracks('medium_term', limit, buildArtists('medium_term', 10));

    // Add "Recommended" prefix to distinguish from top tracks
    const recommendedTracks = mockTracks.map((track, index) => ({
      ...track,
      id: `mock-recommendation-${index + 1}`,
      name: `Recommended: ${track.name}`
    }));

    return {
      seeds: [
        ...(params.seed_tracks?.slice(0, 5).map((id) => ({
          id,
          type: 'TRACK',
          href: `https://api.spotify.com/v1/tracks/${id}`
        })) || []),
        ...(params.seed_artists?.slice(0, 5).map((id) => ({
          id,
          type: 'ARTIST',
          href: `https://api.spotify.com/v1/artists/${id}`
        })) || []),
        ...(params.seed_genres?.slice(0, 5).map((genre) => ({
          id: genre,
          type: 'GENRE',
          href: ''
        })) || [])
      ],
      tracks: recommendedTracks
    };
  }

  public async getAvailableGenreSeeds(): Promise<AvailableGenreSeedsResponse> {
    return {
      genres: GENRE_POOL.flat()
    };
  }

  private getDataset(timeRange: TimeRange): MockDataSet {
    const cached = this.data.get(timeRange);
    if (cached) return cached;

    const artists = buildArtists(timeRange, 40);
    const tracks = buildTracks(timeRange, 60, artists);
    const dataset: MockDataSet = { artists, tracks };
    this.data.set(timeRange, dataset);
    return dataset;
  }
}
