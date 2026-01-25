import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Artist, TimeRange } from '../top-lists-client';
import { TranslationMapper } from '../translation-mapper';
import { Button } from './ui/button';
import { ArtistCard } from './ArtistCard';

interface TopArtistsSectionProps {
  artists: Artist[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  translator: TranslationMapper;
  timeRange: TimeRange;
}

export function TopArtistsSection({
  artists,
  isLoading,
  hasMore,
  onLoadMore,
  translator
}: TopArtistsSectionProps) {
  const [header, setHeader] = useState('Top Artists');
  const [loadMoreText, setLoadMoreText] = useState('Load More');

  useEffect(() => {
    translator.initializedPromise.then(() => {
      try {
        setHeader(translator.get('top-artists-header'));
        setLoadMoreText(translator.get('load-more-button'));
      } catch (e) {
        console.warn('Translation error:', e);
      }
    });
  }, [translator]);

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold">{header}</h2>

      {artists.length === 0 && !isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Oops... no data found!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {artists.map((artist, index) => (
              <ArtistCard key={artist.id} artist={artist} index={index + 1} />
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
    </section>
  );
}
