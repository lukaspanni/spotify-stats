import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
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

  const handleCreate = async (): Promise<void> => {
    if (selectedTrackIds.size === 0) return;

    setIsCreating(true);
    try {
      const trackUris = Array.from(selectedTrackIds).map((id) => `spotify:track:${id}`);
      const result = await client.createPlaylist(playlistName, trackUris);

      if (result) {
        window.open(result.external_urls.spotify, '_blank');
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{texts.title}</DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-name">{texts.nameLabel}</Label>
            <Input
              id="playlist-name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder={texts.nameLabel}
            />
          </div>

          <div className="space-y-2">
            <Label>{texts.selectLabel}</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto border rounded-md p-4 space-y-2">
                {tracks.map((track, index) => (
                  <div key={track.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={track.id}
                      checked={selectedTrackIds.has(track.id)}
                      onChange={() => toggleTrack(track.id)}
                    />
                    <Label htmlFor={track.id} className="flex-1 cursor-pointer">
                      {index + 1}. {track.name} - {track.artists.map((a) => a.name).join(', ')}
                    </Label>
                  </div>
                ))}
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
