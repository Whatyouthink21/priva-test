import { useEffect, useState } from 'react';
import { getImdbRating, type ImdbRating } from '../lib/omdb';

export function useImdb(imdbId: string | null | undefined): ImdbRating | null {
  const [value, setValue] = useState<ImdbRating | null>(null);
  useEffect(() => {
    let alive = true;
    setValue(null);
    if (imdbId) getImdbRating(imdbId).then((v) => alive && setValue(v));
    return () => {
      alive = false;
    };
  }, [imdbId]);
  return value;
}
