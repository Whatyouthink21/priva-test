import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, Play } from 'lucide-react';
import type { Title } from '../lib/tmdb';
import { detailsOf, watchOf } from '../lib/routes';
import { ListButton } from './ListButton';
import { TmdbScore } from './RatingBadges';

const INTERVAL = 8000;

export function Hero({ items }: { items: Title[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => window.clearTimeout(t);
  }, [index, count, paused]);

  if (!count) return null;
  const current = items[index % count];

  return (
    <section className={`hero ${paused ? "is-paused" : ""}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel">
      {items.map((t, i) => (
        <div key={t.key} className={`hero__slide ${i === index ? 'is-active' : ''}`} aria-hidden={i !== index}>
          {t.backdrop && <img src={t.backdrop} alt="" />}
        </div>
      ))}
      <div className="hero__veil" />
      <div className="hero__content" key={current.key}>
        <p className="eyebrow hero__enter" style={{ '--d': '0ms' } as React.CSSProperties}>
          {current.type === 'movie' ? 'Film' : 'Series'} · Trending this week · No. {(index % count) + 1}
        </p>
        <h1 className="hero__title hero__enter" style={{ '--d': '80ms' } as React.CSSProperties}>
          {current.title}
        </h1>
        <div className="hero__meta hero__enter" style={{ '--d': '160ms' } as React.CSSProperties}>
          <TmdbScore value={current.rating} votes={current.votes} />
          {current.year && <span>{current.year}</span>}
          <span>{current.type === 'movie' ? 'Feature film' : 'Television'}</span>
        </div>
        <p className="hero__overview hero__enter" style={{ '--d': '240ms' } as React.CSSProperties}>
          {current.overview}
        </p>
        <div className="hero__actions hero__enter" style={{ '--d': '320ms' } as React.CSSProperties}>
          <Link className="btn btn--primary" to={watchOf(current)}>
            <Play size={17} fill="currentColor" /> Play
          </Link>
          <Link className="btn btn--ghost" to={detailsOf(current)}>
            <Info size={17} /> Details
          </Link>
          <ListButton title={current} />
        </div>
      </div>
      <div className="hero__dots" role="tablist" aria-label="Featured titles">
        {items.map((t, i) => (
          <button
            key={t.key}
            style={{ '--dur': `${INTERVAL}ms` } as React.CSSProperties}
            role="tab"
            aria-selected={i === index}
            aria-label={`Show ${t.title}`}
            className={i === index ? 'is-active' : ''}
            onClick={() => setIndex(i)}
          >
            <span className="hero__bar" />
          </button>
        ))}
      </div>
    </section>
  );
}
