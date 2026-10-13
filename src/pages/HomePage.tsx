import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Play, X } from 'lucide-react';
import { getGenres, getList, getTrending, type Title, type MediaType } from '../lib/tmdb';
import { useAsync } from '../hooks/useAsync';
import { useTitle } from '../hooks/useTitle';
import { Hero } from '../components/Hero';
import { Rail } from '../components/Rail';
import { PosterCard, PosterSkeleton, libraryToTitle } from '../components/PosterCard';
import { Chips } from '../components/MediaGrid';
import { Empty, ErrorState, SetupNotice } from '../components/States';
import { Reveal } from '../components/Reveal';
import { useLibrary } from '../context/LibraryContext';
import { paths, detailsOf } from '../lib/routes';
import { TMDB_KEY } from '../config';

function Shelf({ title, eyebrow, to, data, loading, error, type }: { title: string; eyebrow: string; to?: string; data?: Title[]; loading: boolean; error?: Error; type?: MediaType }) {
  return (
    <Rail eyebrow={eyebrow} title={title} seeAll={to ? { to } : undefined}>
      {error ? (
        <ErrorState error={error} />
      ) : loading || !data ? (
        <PosterSkeleton count={7} />
      ) : (
        data.slice(0, 20).map((t, i) => <PosterCard key={`${type}-${t.key}`} title={t} index={i} />)
      )}
    </Rail>
  );
}

export function HomePage() {
  useTitle();
  const [range, setRange] = useState<'day' | 'week'>('week');
  const { list, history, removeWatch } = useLibrary();

  const trending = useAsync(() => getTrending('all', range), [range]);
  const movies = useAsync(() => getList('movie', 'popular'), []);
  const movieTop = useAsync(() => getList('movie', 'top_rated'), []);
  const movieNow = useAsync(() => getList('movie', 'now_playing'), []);
  const tv = useAsync(() => getList('tv', 'popular'), []);
  const tvTop = useAsync(() => getList('tv', 'top_rated'), []);
  const tvAir = useAsync(() => getList('tv', 'on_the_air'), []);
  const upcoming = useAsync(() => getList('movie', 'upcoming', 2), []);
  const genres = useAsync(() => getGenres('movie'), []);

  const heroItems = useMemo(() => (trending.data?.items ?? []).filter((t) => t.backdrop).slice(0, 6), [trending.data]);
  const top10 = useMemo(() => (trending.data?.items ?? []).slice(0, 10), [trending.data]);
  const continueItems = history.filter((h) => h.percent < 95).slice(0, 12);

  if (!TMDB_KEY) return <SetupNotice />;

  return (
    <>
      {trending.loading && !trending.data ? (
        <div className="hero hero--loading" aria-hidden>
          <div className="skeleton hero__skeleton" />
        </div>
      ) : trending.error ? (
        <div className="container section"><ErrorState error={trending.error} /></div>
      ) : (
        <Hero items={heroItems} />
      )}

      <div className="container home">
        {continueItems.length > 0 && (
          <Rail eyebrow="Pick up where you left off" title="Continue watching" seeAll={{ label: 'History', to: paths.library() }}>
            {continueItems.map((h) => (
              <article key={h.key} className="continue">
                <Link to={h.type === 'movie' ? paths.watch('movie', h.tmdbId) : paths.watch('tv', h.tmdbId, h.season, h.episode)} className="continue__frame">
                  {h.backdrop ? <img src={h.backdrop} alt="" loading="lazy" /> : <span className="poster__fallback">{h.title}</span>}
                  <span className="poster__shade" />
                  <span className="continue__play"><Play size={18} fill="currentColor" /></span>
                  <span className="continue__meta">
                    <b>{h.title}</b>
                    <small>{h.type === 'tv' && h.season ? `S${h.season} · E${h.episode}` : h.type === 'movie' ? 'Film' : 'Series'}</small>
                  </span>
                  <span className="progress"><span style={{ width: `${Math.max(4, h.percent)}%` }} /></span>
                </Link>
                <button className="continue__remove" aria-label={`Remove ${h.title} from history`} onClick={() => removeWatch(h.key)}>
                  <X size={14} />
                </button>
              </article>
            ))}
          </Rail>
        )}

        {list.length > 0 && (
          <Rail eyebrow="Saved" title="My List" seeAll={{ to: paths.library() }}>
            {list.slice(0, 20).map((i, n) => <PosterCard key={i.key} index={n} title={libraryToTitle(i)} />)}
          </Rail>
        )}

        <section className="section">
          <Reveal>
            <header className="section-head section-head--wide">
              <div>
                <p className="eyebrow">Ranking</p>
                <h2>Top 10 {range === 'week' ? 'this week' : 'today'}</h2>
              </div>
              <div className="segmented" role="tablist" aria-label="Trending window">
                <button role="tab" aria-selected={range === 'day'} className={range === 'day' ? 'is-on' : ''} onClick={() => setRange('day')}>Today</button>
                <button role="tab" aria-selected={range === 'week'} className={range === 'week' ? 'is-on' : ''} onClick={() => setRange('week')}>This week</button>
              </div>
            </header>
          </Reveal>
          {trending.error ? (
            <ErrorState error={trending.error} />
          ) : (
            <div className="top10">
              {(trending.data ? top10 : Array.from({ length: 10 }, () => null)).map((t, i) =>
                t ? (
                  <Link key={t.key} to={detailsOf(t)} className="top10__item" style={{ '--i': i } as React.CSSProperties}>
                    <span className="top10__num">{i + 1}</span>
                    <span className="top10__poster">{t.poster && <img src={t.poster} alt="" loading="lazy" />}</span>
                    <span className="top10__text">
                      <b>{t.title}</b>
                      <small>{t.type === 'movie' ? 'Film' : 'Series'} · {t.year || '—'}</small>
                    </span>
                  </Link>
                ) : (
                  <div key={i} className="top10__item top10__item--skeleton skeleton" />
                ),
              )}
            </div>
          )}
        </section>

        <Rail eyebrow="Trending" title={range === 'week' ? 'Everyone is watching' : 'Trending today'}>
          {trending.error ? (
            <ErrorState error={trending.error} />
          ) : trending.loading && !trending.data ? (
            <PosterSkeleton count={7} />
          ) : (
            (trending.data?.items ?? []).map((t, i) => <PosterCard key={t.key} title={t} index={i} />)
          )}
        </Rail>

        <Shelf eyebrow="Films" title="Popular films" to={paths.browse('movie')} data={movies.data?.items} loading={movies.loading} error={movies.error} type="movie" />
        <Shelf eyebrow="Films" title="Now in cinemas" to={`${paths.browse('movie')}?collection=now`} data={movieNow.data?.items} loading={movieNow.loading} error={movieNow.error} type="movie" />
        <Shelf eyebrow="Series" title="Popular series" to={paths.browse('tv')} data={tv.data?.items} loading={tv.loading} error={tv.error} type="tv" />
        <Shelf eyebrow="Series" title="On the air" to={`${paths.browse('tv')}?collection=now`} data={tvAir.data?.items} loading={tvAir.loading} error={tvAir.error} type="tv" />
        <Shelf eyebrow="Acclaimed" title="Top-rated films" to={`${paths.browse('movie')}?collection=top`} data={movieTop.data?.items} loading={movieTop.loading} error={movieTop.error} type="movie" />
        <Shelf eyebrow="Acclaimed" title="Top-rated series" to={`${paths.browse('tv')}?collection=top`} data={tvTop.data?.items} loading={tvTop.loading} error={tvTop.error} type="tv" />
        <Shelf eyebrow="Coming up" title="Upcoming films" to={`${paths.browse('movie')}?collection=upcoming`} data={upcoming.data?.items} loading={upcoming.loading} error={upcoming.error} type="movie" />

        <section className="section">
          <Reveal>
            <header className="section-head">
              <div>
                <p className="eyebrow">Categories</p>
                <h2>Find it by genre</h2>
              </div>
              <Link to={paths.search()} className="link-arrow">Search all <ArrowUpRight size={15} /></Link>
            </header>
          </Reveal>
          {genres.loading && !genres.data ? (
            <div className="genre-grid">{Array.from({ length: 10 }, (_, i) => <div key={i} className="genre-tile skeleton" />)}</div>
          ) : genres.error ? (
            <ErrorState error={genres.error} />
          ) : genres.data && genres.data.length ? (
            <Chips>
              <div className="genre-grid">
                {genres.data.map((g, i) => (
                  <Link key={g.id} to={`${paths.browse('movie')}?genre=${g.id}`} className="genre-tile" style={{ '--i': i } as React.CSSProperties} role="listitem">
                    <span className="genre-tile__index">{String(i + 1).padStart(2, '0')}</span>
                    <span className="genre-tile__name">{g.name}</span>
                    <ArrowUpRight size={16} className="genre-tile__arrow" />
                  </Link>
                ))}
              </div>
            </Chips>
          ) : (
            <Empty title="No categories yet" />
          )}
        </section>
      </div>
    </>
  );
}
