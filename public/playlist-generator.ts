import { Playlist, SpotifyURI, Track, User } from './spotify-types';

export interface PlaylistGenerator {
  createPlaylist(user: User, playlistName: string, description: string, isPrivate: boolean): Promise<Playlist>;
  addTracksToPlaylist(playlist: Playlist, tracks: Track[] | SpotifyURI[]): Promise<Playlist>;
}
