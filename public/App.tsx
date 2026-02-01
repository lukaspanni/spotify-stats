import React, { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Moon, Sun } from 'lucide-react';
import { Button } from './components/ui/button';
import { AuthorizeView } from './components/AuthorizeView';
import { TopListsView } from './components/TopListsView';
import { TopListsClient, TimeRange } from './top-lists-client';
import { TopListsClientFactory } from './top-lists-client-factory';
import { TranslationMapper } from './translation-mapper';
import { queryClient } from './query-client';
import { useFeatureFlags } from './hooks/useFeatureFlags';

function AppContent(): React.JSX.Element {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [topListsClient, setTopListsClient] = useState<TopListsClient | null>(null);
  const [translationMapper, setTranslationMapper] = useState<TranslationMapper | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('short_term');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Use TanStack Query for feature flags with caching
  const { data: featureFlags = { recommendations: false } } = useFeatureFlags();

  useEffect(() => {
    // Check for dark mode preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) document.documentElement.classList.add('dark');

    // Initialize translation mapper
    const mapper = new TranslationMapper(TranslationMapper.detectLanguage());
    setTranslationMapper(mapper);

    if (import.meta.env.DEV) {
      setIsAuthorized(true);
      try {
        const client = new TopListsClientFactory().getTopListsClient();
        setTopListsClient(client);
      } catch (e) {
        console.error('Failed to initialize dev client:', e);
      }
    } else {
      // Check access token
      const accessTokenCookie = document.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('accessToken='))
        ?.split('=')[1];

      const accessToken = (() => {
        if (!accessTokenCookie) return null;
        try {
          return JSON.parse(decodeURIComponent(accessTokenCookie)) as {
            token?: string;
            expires?: number;
          };
        } catch (e) {
          console.error('Failed to parse accessToken cookie:', e);
          // Optionally clear invalid cookie to avoid repeated errors
          document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
          return null;
        }
      })();

      if (accessToken?.token) {
        const now = new Date().getTime();
        if (accessToken.expires && accessToken.expires > now) {
          setIsAuthorized(true);
          try {
            const client = new TopListsClientFactory().getTopListsClient(accessToken.token);
            setTopListsClient(client);
          } catch (e) {
            console.error('Failed to initialize client:', e);
          }
        } else window.location.href = '/refresh-token';
      }
    }

    // Get time range from URL
    const queryTimeRange = new URLSearchParams(window.location.search).get('time_range');
    if (queryTimeRange && ['long_term', 'medium_term', 'short_term'].includes(queryTimeRange))
      setTimeRange(queryTimeRange as TimeRange);
  }, []);

  const toggleDarkMode = (): void => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="fixed top-4 right-4 z-50">
        <Button variant="outline" size="icon" onClick={toggleDarkMode}>
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {isAuthorized && topListsClient && translationMapper ? (
        <TopListsView
          client={topListsClient}
          translator={translationMapper}
          initialTimeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          enableRecommendations={featureFlags.recommendations}
        />
      ) : (
        <AuthorizeView translator={translationMapper} />
      )}

      <footer className="w-full py-6 mt-auto text-center bg-muted/50 backdrop-blur-sm">
        <span className="text-sm text-muted-foreground">&copy; 2025 Lukas Panni</span>
        <br />
        <div className="flex justify-center gap-4 mt-2">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://blog.lukaspanni.de/impressum/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Impressum
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://blog.lukaspanni.de/datenschutzerklaerung/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Datenschutz
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/lukaspanni/spotify-stats"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

export function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
