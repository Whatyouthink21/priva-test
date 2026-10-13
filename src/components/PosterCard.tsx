import { Link } from 'react-router-dom';
import { Play, Plus, Check } from 'lucide-react';
import type { Title } from '../lib/tmdb';
import { detailsOf, watchOf } from '../lib/routes';
import { useLibrary } from '../context/LibraryContext';
import { score } from '../lib/format';

export function libraryToTitle(i: { key: string; type: Title['type']; tmdbId: number; title: string; poster: string | null; backdrop: string | null; year: string; rating: number }): Title {
  return { key: i.key, id: i.tmdbId, type: i.type, title: i.title, poster: i.poster, backdrop: i.backdrop, year: i.year, rating: i.rating, overview: '', votes: 0, date: '', genreIds: [], popularity: 0, language: '' };
}

export function PosterCard({ title, rank, index = 0, note }: { title: Title; rank?: number; index?: number; note?: string }) {
  const { isInList, toggleList } = useLibrary();
  const saved = isInList(title.type, title.id);
  return (
    <article className="poster" style={{ '--i': index } as React.CSSProperties}>
      <Link to={detailsOf(title)} className="poster__frame" aria-label={title.title}>
        {title.poster ? (
          <img src={title.poster} alt="" loading="lazy" decoding="async" />
        ) : (
          <div className="poster__fallback">{title.title}</div>
        )}
        {rank !== undefined && <span className="poster__rank" aria-hidden>{rank}</span>}
        <span className="poster__type">{title.type === 'movie' ? 'Film' : 'Series'}</span>
        <span className="poster__shade" />
        <span className="poster__play" aria-hidden>
          <Play size={16} fill="currentColor" />
        </span>
      </Link>
      <div className="poster__meta">
        <Link to={detailsOf(title)} className="poster__title">
          {title.title}
        </Link>
        <div className="poster__sub">
          <span>{title.year || '—'}</span>
          <span className="dot" />
          <span className="score">★ {score(title.rating)}</span>
        </div>
        {note && <div className="poster__note">{note}</div>}
      </div>
      <div className="poster__actions">
        <Link to={watchOf(title)} className="icon-btn" aria-label={`Play ${title.title}`} title="Play">
          <Play size={14} fill="currentColor" />
        </Link>
        <button
          className={`icon-btn ${saved ? 'is-on' : ''}`}
          aria-label={saved ? 'Remove from My List' : 'Add to My List'}
          title={saved ? 'In My List' : 'Add to My List'}
          onClick={() =>
            toggleList({ type: title.type, tmdbId: title.id, title: title.title, poster: title.poster, backdrop: title.backdrop, year: title.year, rating: title.rating })
          }
        >
          {saved ? <Check size={14} /> : <Plus size={14} />}
        </button>
      </div>
    </article>
  );
}

export function PosterSkeleton({ count = 12 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div className="poster poster--skeleton" key={i} aria-hidden>
          <div className="poster__frame skeleton" />
          <div className="poster__meta">
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--short" />
          </div>
        </div>
      ))}
    </>
  );
}
