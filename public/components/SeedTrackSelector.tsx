import React from 'react';
import { Check } from 'lucide-react';
import { Track } from '../top-lists-client';
import { TranslationMapper } from '../translation-mapper';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface SeedTrackSelectorProps {
  availableTracks: Track[];
  selectedSeeds: string[];
  onSeedsChange: (seeds: string[]) => void;
  onConfirm: () => void;
  translator: TranslationMapper;
}

export function SeedTrackSelector({
  availableTracks,
  selectedSeeds,
  onSeedsChange,
  onConfirm,
  translator
}: SeedTrackSelectorProps): React.JSX.Element {
  const toggleTrack = (trackId: string): void => {
    if (selectedSeeds.includes(trackId)) onSeedsChange(selectedSeeds.filter((id) => id !== trackId));
    else onSeedsChange([...selectedSeeds, trackId]);
  };

  const selectAll = (): void => {
    onSeedsChange(availableTracks.map((t) => t.id));
  };

  const clearAll = (): void => {
    onSeedsChange([]);
  };

  const translate = (key: string, fallback: string): string => {
    if (!translator) return fallback;
    try {
      return translator.get(key);
    } catch {
      return fallback;
    }
  };

  return (
    <Card className="p-4 bg-muted/30">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{translate('recommendations.selectTracks', 'Select Seed Tracks')}</h3>
            <p className="text-sm text-muted-foreground">
              {translate(
                'recommendations.selectTracksHelp',
                `Choose tracks to base recommendations on. You can select more than 5 - we'll make multiple requests!`
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {translate('recommendations.selectAll', 'Select All')}
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              {translate('recommendations.clearAll', 'Clear All')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
          {availableTracks.map((track) => {
            const isSelected = selectedSeeds.includes(track.id);
            return (
              <button
                key={track.id}
                onClick={() => toggleTrack(track.id)}
                className={`flex items-center gap-3 p-2 rounded-lg border-2 transition-all text-left ${
                  isSelected ? 'border-spotify bg-spotify/10' : 'border-transparent bg-muted/50 hover:bg-muted'
                }`}
              >
                <div className="flex-shrink-0">
                  {track.album.images.find((i) => i.height === 64)?.url || track.album.images[0]?.url ? (
                    <img
                      src={track.album.images.find((i) => i.height === 64)?.url || track.album.images[0]?.url}
                      alt={track.album.name}
                      className="w-12 h-12 rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <span className="text-xs">♪</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{track.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {track.artists.map((a) => a.name).join(', ')}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-spotify flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {translate('recommendations.selectedCount', `${selectedSeeds.length} tracks selected`)}
          </p>
          <Button onClick={onConfirm} disabled={selectedSeeds.length === 0}>
            {translate('recommendations.getRecommendations', 'Get Recommendations')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
