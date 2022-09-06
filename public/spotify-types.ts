export type Image = { url: string; height: number; width: number };

export type SpotifyEntity = {
  name: string;
  external_urls: { spotify: string };
  id: string;
  popularity: number;
};

export type Artist = SpotifyEntity & { genres: string[]; images: Image[] };
export type Track = SpotifyEntity & { artists: Artist[]; album: { name: string; images: Image[] } };
