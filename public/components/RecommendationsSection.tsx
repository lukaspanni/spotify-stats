import React, { useState, useEffect } from 'react';
import { Music, Sparkles, RefreshCw } from 'lucide-react';
import { TopListsClient, Track, TimeRange } from '../top-lists-client';
import { TranslationMapper } from '../translation-mapper';
import { TrackCard } from './TrackCard';
import { Button } from './ui/button';
import { SeedTrackSelector } from './SeedTrackSelector';

interface RecommendationsSectionProps {
  client: TopListsClient;
  translator: TranslationMapper;
  timeRange: TimeRange;
}

export function RecommendationsSection({
  client,
  translator,
  timeRange
}: RecommendationsSectionProps): React.JSX.Element {
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [selectedSeeds, setSelectedSeeds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    loadTopTracks();
  }, [timeRange]);

  const loadTopTracks = async (): Promise<void> => {
    try {
      const result = await client.getTopTracks(timeRange, 20);
      setTopTracks(result.items);
      // Auto-select first 5 tracks as default seeds
      const defaultSeeds = result.items.slice(0, 5).map((t) => t.id);
      setSelectedSeeds(defaultSeeds);
      // Auto-load recommendations with default seeds
      if (defaultSeeds.length > 0) loadRecommendations(defaultSeeds);
    } catch (error) {
      console.error('Error loading top tracks:', error);
    }
  };

  const loadRecommendations = async (seedIds?: string[]): Promise<void> => {
    const seeds = seedIds || selectedSeeds;
    if (seeds.length === 0) return;

    setIsLoading(true);
    try {
      const result = await client.getRecommendations({
        seed_tracks: seeds,
        limit: 20
      });
      setRecommendations(result.tracks);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedsChange = (newSeeds: string[]): void => {
    setSelectedSeeds(newSeeds);
  };

  const handleGetRecommendations = (): void => {
    loadRecommendations();
    setShowSelector(false);
  };

  const handleRefresh = (): void => {
    loadRecommendations();
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
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-spotify/10 rounded-lg">
            <Sparkles className="w-6 h-6 text-spotify" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{translate('recommendations.title', 'Recommended for You')}</h2>
            <p className="text-sm text-muted-foreground">
              {translate('recommendations.subtitle', `Based on ${selectedSeeds.length} of your favorite tracks`)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSelector(!showSelector)}>
            <Music className="w-4 h-4 mr-2" />
            {translate('recommendations.selectSeeds', 'Select Tracks')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {translate('recommendations.refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {showSelector && (
        <SeedTrackSelector
          availableTracks={topTracks}
          selectedSeeds={selectedSeeds}
          onSeedsChange={handleSeedsChange}
          onConfirm={handleGetRecommendations}
          translator={translator}
        />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {recommendations.map((track, index) => (
            <TrackCard key={track.id} track={track} index={index + 1} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>{translate('recommendations.noResults', 'No recommendations yet. Select tracks to get started!')}</p>
        </div>
      )}
    </section>
  );
}
