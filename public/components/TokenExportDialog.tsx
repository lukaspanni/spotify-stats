import React, { useState } from 'react';
import { Download, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expires: number;
}

export function TokenExportDialog(): React.JSX.Element {
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchTokens = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/get-tokens');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch tokens');
      }

      const data = await response.json();
      setTokens(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean): void => {
    setIsOpen(open);
    if (open && !tokens) fetchTokens();
  };

  const copyToClipboard = async (text: string, field: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Tokens
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Tokens for Preview/Local Dev</DialogTitle>
          <DialogDescription>
            Copy these tokens to use them in preview deployments or local development environments where OAuth redirect
            won't work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spotify"></div>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {tokens && !loading && (
            <>
              <div className="space-y-2">
                <Label htmlFor="access-token-export">Access Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="access-token-export"
                    type="text"
                    value={tokens.accessToken}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(tokens.accessToken, 'access')}
                    className="flex-shrink-0"
                  >
                    {copiedField === 'access' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refresh-token-export">Refresh Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="refresh-token-export"
                    type="text"
                    value={tokens.refreshToken}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(tokens.refreshToken, 'refresh')}
                    className="flex-shrink-0"
                  >
                    {copiedField === 'refresh' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2 border border-border/50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      <strong className="text-foreground">How to use these tokens:</strong>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Open your preview or local environment</li>
                      <li>The app will show a "Paste Tokens" form</li>
                      <li>Paste the access token and refresh token</li>
                      <li>Click "Set Tokens" to authenticate</li>
                    </ol>
                    <p className="mt-2">
                      <strong className="text-foreground">Note:</strong> The access token expires at{' '}
                      {new Date(tokens.expires).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
