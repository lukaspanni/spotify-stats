export type SpotifyURI = string; //TODO: validate?

export type SpotifyEntity = {
  name: string;
  external_urls: { spotify: string };
  id: string;
  popularity: number;
};

export type Image = { url: string; height: number; width: number };

export type Artist = SpotifyEntity & { genres: string[]; images: Image[] };
export type Track = SpotifyEntity & { artists: Artist[]; album: { name: string; images: Image[] } };
export type Playlist = SpotifyEntity & { tracks: Track[]; images: Image[] };
