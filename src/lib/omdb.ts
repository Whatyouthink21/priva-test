import { OMDB_KEY } from '../config';

// IMDb ratings are not exposed by TMDB, so they are read from OMDb (which mirrors IMDb's
// public rating). Requires a free key in VITE_OMDB_API_KEY. Results are cached for a week.

export interface ImdbRating {
  rating: number;
  votes: string;
}

const TTL = 7 * 24 * 60 * 60 * 1000;
const memo = new Map<string, Promise<ImdbRating | null>>();

export const imdbEnabled = Boolean(OMDB_KEY);

function readStore(id: string): ImdbRating | null | undefined {
  try {
    const raw = localStorage.getItem(`priva:imdb:${id}`);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { at: number; value: ImdbRating | null };
    if (Date.now() - parsed.at > TTL) return undefined;
    return parsed.value;
  } catch {
    return undefined;
  }
}

function writeStore(id: string, value: ImdbRating | null) {
  try {
    localStorage.setItem(`priva:imdb:${id}`, JSON.stringify({ at: Date.now(), value }));
  } catch {
    /* storage full or disabled — ignore */
  }
}

export function getImdbRating(imdbId: string): Promise<ImdbRating | null> {
  if (!OMDB_KEY || !imdbId) return Promise.resolve(null);
  const hit = memo.get(imdbId);
  if (hit) return hit;
  const cached = readStore(imdbId);
  if (cached !== undefined) {
    const p = Promise.resolve(cached);
    memo.set(imdbId, p);
    return p;
  }
  const p = fetch(`https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_KEY}`)
    .then((r) => r.json())
    .then((j: { Response?: string; imdbRating?: string; imdbVotes?: string }) => {
      const value: ImdbRating | null =
        j.Response === 'True' && j.imdbRating && j.imdbRating !== 'N/A'
          ? { rating: parseFloat(j.imdbRating), votes: j.imdbVotes ?? '' }
          : null;
      writeStore(imdbId, value);
      return value;
    })
    .catch(() => {
      memo.delete(imdbId);
      return null;
    });
  memo.set(imdbId, p);
  return p;
}

export const imdbUrl = (imdbId: string) => `https://www.imdb.com/title/${imdbId}/`;
