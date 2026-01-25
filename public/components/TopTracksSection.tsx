import React, { useState, useEffect } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Track, TimeRange, TopListsClient } from '../top-lists-client';
import { TranslationMapper } from '../translation-mapper';
import { Button } from './ui/button';
import { TrackCard } from './TrackCard';
import { CreatePlaylistDialog } from './CreatePlaylistDialog';

interface TopTracksSectionProps {
  tracks: Track[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  translator: TranslationMapper;
  timeRange: TimeRange;
  client: TopListsClient;
}

export function TopTracksSection({
  tracks,
  isLoading,
  hasMore,
  onLoadMore,
  translator,
  timeRange,
  client
}: TopTracksSectionProps) {
  const [header, setHeader] = useState('Top Tracks');
  const [loadMoreText, setLoadMoreText] = useState('Load More');
  const [createPlaylistText, setCreatePlaylistText] = useState('Create Playlist');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    translator.initializedPromise.then(() => {
      try {
        setHeader(translator.get('top-tracks-header'));
        setLoadMoreText(translator.get('load-more-button'));
        setCreatePlaylistText(translator.get('create-playlist-button'));
      } catch (e) {
        console.warn('Translation error:', e);
      }
    });
  }, [translator]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">{header}</h2>
        {tracks.length > 0 && (
          <Button variant="spotify" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {createPlaylistText}
          </Button>
        )}
      </div>

      {tracks.length === 0 && !isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Oops... no data found!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tracks.map((track, index) => (
              <TrackCard key={track.id} track={track} index={index + 1} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  loadMoreText
                )}
              </Button>
            </div>
          )}
        </>
      )}

      <CreatePlaylistDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        translator={translator}
        timeRange={timeRange}
        client={client}
      />
    </section>
  );
}
