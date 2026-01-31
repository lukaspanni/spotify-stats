import React, { useState, useEffect } from 'react';
import { Loader2, Music, CheckCircle2, Circle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { TimeRange, TopListsClient, Track } from '../top-lists-client';
import { TranslationMapper } from '../translation-mapper';

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  translator: TranslationMapper;
  timeRange: TimeRange;
  client: TopListsClient;
}

export function CreatePlaylistDialog({
  open,
  onOpenChange,
  translator,
  timeRange,
  client
}: CreatePlaylistDialogProps): React.JSX.Element {
  const [playlistName, setPlaylistName] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [texts, setTexts] = useState({
    title: 'Create Playlist from Top Tracks',
    description: 'Create a new Spotify playlist with your top tracks from this time range.',
    nameLabel: 'Playlist Name',
    selectLabel: 'Select tracks to include:',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    tracksSelected: 'tracks selected',
    cancel: 'Cancel',
    create: 'Create',
    creating: 'Creating...',
    success: 'Playlist created successfully!',
    error: 'Failed to create playlist'
  });

  useEffect(() => {
    translator.initializedPromise.then(() => {
      try {
        const playlistTitleKey =
          timeRange === 'long_term'
            ? 'playlist-title-all-time'
            : timeRange === 'medium_term'
              ? 'playlist-title-6-months'
              : 'playlist-title-4-weeks';

        setTexts({
          title: translator.get('create-playlist-dialog-title'),
          description: translator.get('create-playlist-dialog-description'),
          nameLabel: translator.get('playlist-name-label'),
          selectLabel: translator.get('select-tracks-label'),
          selectAll: translator.get('select-all-button') || 'Select All',
          deselectAll: translator.get('deselect-all-button') || 'Deselect All',
          tracksSelected: translator.get('tracks-selected') || 'tracks selected',
          cancel: translator.get('cancel-button'),
          create: translator.get('confirm-button'),
          creating: translator.get('creating-playlist'),
          success: translator.get('playlist-created-success'),
          error: translator.get('playlist-created-error')
        });
        setPlaylistName(translator.get(playlistTitleKey));
      } catch (e) {
        console.warn('Translation error:', e);
      }
    });
  }, [translator, timeRange]);

  useEffect(() => {
    if (open) fetchTracks();
  }, [open, timeRange]);

  const fetchTracks = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await client.getTopTracks(timeRange, 50, 0);
      if (result && result.items) {
        setTracks(result.items);
        setSelectedTrackIds(new Set(result.items.map((t) => t.id)));
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTrack = (trackId: string): void => {
    setSelectedTrackIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) newSet.delete(trackId);
      else newSet.add(trackId);

      return newSet;
    });
  };

  const selectAll = (): void => {
    setSelectedTrackIds(new Set(tracks.map((t) => t.id)));
  };

  const deselectAll = (): void => {
    setSelectedTrackIds(new Set());
  };

  const handleCreate = async (): Promise<void> => {
    if (selectedTrackIds.size === 0) return;

    setIsCreating(true);
    try {
      const trackUris = Array.from(selectedTrackIds).map((id) => `spotify:track:${id}`);
      const result = await client.createPlaylist(playlistName, trackUris);

      if (result) {
        window.open(result.external_urls.spotify, '_blank', 'noopener,noreferrer');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert(texts.error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{texts.title}</DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="playlist-name" className="text-base font-medium">
              {texts.nameLabel}
            </Label>
            <Input
              id="playlist-name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder={texts.nameLabel}
              className="h-10"
            />
          </div>

          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">{texts.selectLabel}</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {selectedTrackIds.size} {texts.tracksSelected}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="xs" onClick={selectAll} disabled={isLoading}>
                    {texts.selectAll}
                  </Button>
                  <Button variant="ghost" size="xs" onClick={deselectAll} disabled={isLoading}>
                    {texts.deselectAll}
                  </Button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto border rounded-lg bg-muted/30">
                <div className="divide-y">
                  {tracks.map((track, index) => {
                    const isSelected = selectedTrackIds.has(track.id);
                    const imageUrl =
                      track.album.images.find((i) => i.height === 64)?.url ||
                      track.album.images.find((i) => i.height <= 300)?.url ||
                      track.album.images[0]?.url;

                    return (
                      <div
                        key={track.id}
                        className={`flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-muted/40' : ''
                        }`}
                        onClick={() => toggleTrack(track.id)}
                      >
                        <div className="flex items-center justify-center w-8 shrink-0">
                          {isSelected ? (
                            <CheckCircle2 className="w-5 h-5 text-spotify" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="w-10 h-10 shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center">
                          {imageUrl ? (
                            <img src={imageUrl} alt={track.album.name} className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-mono w-6 shrink-0">#{index + 1}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{track.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {track.artists.map((a) => a.name).join(', ')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            {texts.cancel}
          </Button>
          <Button variant="spotify" onClick={handleCreate} disabled={isCreating || selectedTrackIds.size === 0}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {texts.creating}
              </>
            ) : (
              texts.create
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
