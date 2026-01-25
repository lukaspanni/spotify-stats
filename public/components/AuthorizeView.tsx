import React from 'react';
import { Music } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TranslationMapper } from '../translation-mapper';

interface AuthorizeViewProps {
  translator: TranslationMapper | null;
}

export function AuthorizeView({ translator }: AuthorizeViewProps) {
  const [heading, setHeading] = React.useState('Your top tracks and artists on Spotify!');
  const [subheading, setSubheading] = React.useState('Authorize your Spotify account to see your top tracks and artists.');
  const [buttonText, setButtonText] = React.useState('Authorize');

  React.useEffect(() => {
    if (translator) {
      translator.initializedPromise.then(() => {
        try {
          setHeading(translator.get('heading-unauthorized'));
          setSubheading(translator.get('subheading-unauthorized'));
          setButtonText(translator.get('authorize-button'));
        } catch (e) {
          console.warn('Translation error:', e);
        }
      });
    }
  }, [translator]);

  return (
    <div className="container mx-auto px-4 py-16 min-h-[calc(100vh-200px)] flex items-center justify-center">
      <Card className="max-w-2xl w-full shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-spotify/10 flex items-center justify-center">
            <Music className="w-8 h-8 text-spotify" />
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-spotify to-spotify-dark bg-clip-text text-transparent">
            {heading}
          </CardTitle>
          <CardDescription className="text-lg">{subheading}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <Button size="lg" variant="spotify" className="text-lg px-12 py-6 h-auto" asChild>
            <a href="/login">{buttonText}</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
