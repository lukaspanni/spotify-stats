import React, { useState } from 'react';
import { Key, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { TranslationMapper } from '../translation-mapper';

interface TokenPasteViewProps {
  translator: TranslationMapper | null;
}

export function TokenPasteView({ translator }: TokenPasteViewProps): React.JSX.Element {
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!accessToken.trim() || !refreshToken.trim()) {
      setError('Both access token and refresh token are required');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/set-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: accessToken.trim(),
          refreshToken: refreshToken.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set tokens');
      }

      // Success! Reload the page to trigger auth check
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set tokens');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 min-h-[calc(100vh-200px)] flex items-center justify-center">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-spotify/10 flex items-center justify-center">
            <Key className="w-8 h-8 text-spotify" />
          </div>
          <CardTitle className="text-3xl font-bold">Dev / Preview Authentication</CardTitle>
          <CardDescription className="text-base">
            Paste your access and refresh tokens from the main app to authenticate in this preview/local environment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pb-8">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 border border-border/50">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">How to get your tokens:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Open the main app (production URL) in another tab</li>
                  <li>Click the "Export Tokens" button in the settings</li>
                  <li>Copy the access token and refresh token</li>
                  <li>Paste them into the fields below</li>
                </ol>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="text"
                placeholder="BQD..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="refreshToken">Refresh Token</Label>
              <Input
                id="refreshToken"
                type="text"
                placeholder="AQD..."
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" size="lg" variant="spotify" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Setting Tokens...' : 'Set Tokens'}
            </Button>
          </form>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-center text-muted-foreground">
              Or use the{' '}
              <a href="/login" className="text-spotify hover:underline">
                standard OAuth flow
              </a>{' '}
              (requires configured redirect URI)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
