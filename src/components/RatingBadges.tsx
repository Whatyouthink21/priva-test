import { ExternalLink, Star } from 'lucide-react';
import { useImdb } from '../hooks/useImdb';
import { imdbUrl } from '../lib/omdb';
import { compact, score } from '../lib/format';

export function TmdbScore({ value, votes }: { value: number; votes?: number }) {
  if (!value) return null;
  return (
    <span className="badge badge--tmdb" title={`${compact(votes)} TMDB votes`}>
      <Star size={13} fill="currentColor" />
      <b>{score(value)}</b>
      <small>TMDB</small>
    </span>
  );
}

/** IMDb rating (via OMDb when a key is set) with a link to the IMDb page. */
export function ImdbScore({ imdbId }: { imdbId: string | null }) {
  const rating = useImdb(imdbId);
  if (!imdbId) return null;
  return (
    <a className="badge badge--imdb" href={imdbUrl(imdbId)} target="_blank" rel="noreferrer" title="Open on IMDb">
      <span className="imdb-logo">IMDb</span>
      {rating ? (
        <>
          <b>{rating.rating.toFixed(1)}</b>
          {rating.votes && <small>{rating.votes} votes</small>}
        </>
      ) : (
        <small>View on IMDb</small>
      )}
      <ExternalLink size={11} />
    </a>
  );
}
