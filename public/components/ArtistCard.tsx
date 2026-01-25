import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Artist } from '../top-lists-client';

interface ArtistCardProps {
  artist: Artist;
  index: number;
}

export function ArtistCard({ artist, index }: ArtistCardProps): React.JSX.Element {
  const imageUrl = artist.images?.slice().reverse().find((i) => i.height >= 300)?.url || artist.images?.[0]?.url;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative aspect-square overflow-hidden">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={artist.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          )}
          <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            {index}
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <CardContent className="p-3 space-y-1">
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-spotify transition-colors">
            {artist.name}
          </h3>
          {artist.genres && artist.genres.length > 0 && (
            <p className="text-xs text-muted-foreground line-clamp-1">{artist.genres.slice(0, 3).join(', ')}</p>
          )}
        </CardContent>
      </a>
    </Card>
  );
}
