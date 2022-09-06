import { Playlist, SpotifyURI, Track } from './spotify-types';

export interface PlaylistGenerator {
  createPlaylist(playlistName: string, description: string, isPrivate: boolean): Promise<Playlist>;
  addTracksToPlaylist(playlist: Playlist, tracks: Track[] | SpotifyURI[]): Promise<Playlist>;
}
