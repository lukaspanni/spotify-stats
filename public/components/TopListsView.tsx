import React, { useState, useEffect } from 'react';
import { TopListsClient, TimeRange, Artist, Track } from '../top-lists-client';
import { TranslationMapper } from '../translation-mapper';
import { TimeRangeSelector } from './TimeRangeSelector';
import { TopTracksSection } from './TopTracksSection';
import { TopArtistsSection } from './TopArtistsSection';
import { RecommendationsSection } from './RecommendationsSection';
import { PaginationData } from '../pagination-data';

interface TopListsViewProps {
  client: TopListsClient;
  translator: TranslationMapper;
  initialTimeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
  enableRecommendations?: boolean;
}

export function TopListsView({
  client,
  translator,
  initialTimeRange,
  onTimeRangeChange,
  enableRecommendations = false
}: TopListsViewProps): React.JSX.Element {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);
  const [tracksPagination] = useState(() => new PaginationData(0, 10, 0));
  const [artistsPagination] = useState(() => new PaginationData(0, 10, 0));

  useEffect(() => {
    fetchTopLists();
  }, [timeRange]);

  const fetchTopLists = async (): Promise<void> => {
    tracksPagination.reset(0, 10, 0);
    artistsPagination.reset(0, 10, 0);
    setTopTracks([]);
    setTopArtists([]);
    await Promise.all([fetchTopTracks(), fetchTopArtists()]);
  };

  const fetchTopTracks = async (): Promise<void> => {
    setIsLoadingTracks(true);
    try {
      const result = await client.getTopTracks(
        timeRange,
        tracksPagination.currentLimit,
        tracksPagination.currentOffset
      );
      if (result && result.items) {
        tracksPagination.total = result.total;
        setTopTracks((prev) => {
          const newTracks = result.items.filter((track) => !prev.some((t) => t.id === track.id));
          return [...prev, ...newTracks];
        });
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const fetchTopArtists = async (): Promise<void> => {
    setIsLoadingArtists(true);
    try {
      const result = await client.getTopArtists(
        timeRange,
        artistsPagination.currentLimit,
        artistsPagination.currentOffset
      );
      if (result && result.items) {
        artistsPagination.total = result.total;
        setTopArtists((prev) => {
          const newArtists = result.items.filter((artist) => !prev.some((a) => a.id === artist.id));
          return [...prev, ...newArtists];
        });
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
    } finally {
      setIsLoadingArtists(false);
    }
  };

  const handleTimeRangeChange = (newTimeRange: TimeRange): void => {
    setTimeRange(newTimeRange);
    onTimeRangeChange(newTimeRange);
    history.pushState(null, '', `${window.location.pathname}?time_range=${newTimeRange}`);
  };

  const handleLoadMoreTracks = (): void => {
    tracksPagination.updateOffset();
    fetchTopTracks();
  };

  const handleLoadMoreArtists = (): void => {
    artistsPagination.updateOffset();
    fetchTopArtists();
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl md:text-5xl font-bold text-center bg-linear-to-r from-spotify to-spotify-dark bg-clip-text text-transparent">
          Spotify Stats
        </h1>
        <TimeRangeSelector timeRange={timeRange} onChange={handleTimeRangeChange} translator={translator} />
      </div>

      <TopTracksSection
        tracks={topTracks}
        isLoading={isLoadingTracks}
        hasMore={tracksPagination.remainingElements > 0}
        onLoadMore={handleLoadMoreTracks}
        translator={translator}
        timeRange={timeRange}
        client={client}
      />

      <TopArtistsSection
        artists={topArtists}
        isLoading={isLoadingArtists}
        hasMore={artistsPagination.remainingElements > 0}
        onLoadMore={handleLoadMoreArtists}
        translator={translator}
        timeRange={timeRange}
      />

      {enableRecommendations && (
        <RecommendationsSection client={client} translator={translator} timeRange={timeRange} />
      )}
    </div>
  );
}
