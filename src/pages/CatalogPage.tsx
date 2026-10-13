import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { discover, getGenres, getList, type ListName, type MediaType, type Title } from '../lib/tmdb';
import { useAsync } from '../hooks/useAsync';
import { useInfinite } from '../hooks/useInfinite';
import { useTitle } from '../hooks/useTitle';
import { PosterCard, PosterSkeleton } from '../components/PosterCard';
import { ErrorState, Empty } from '../components/States';
import { Reveal } from '../components/Reveal';
import { SetupNotice } from '../components/States';
import { TMDB_KEY } from '../config';
import { Search, X } from 'lucide-react';

const COLLECTIONS: Record<MediaType, { id: string; label: string; list?: ListName }[]> = {
  movie: [
    { id: 'discover', label: 'Discover' },
    { id: 'top', label: 'Top rated', list: 'top_rated' },
    { id: 'now', label: 'Now playing', list: 'now_playing' },
    { id: 'upcoming', label: 'Upcoming', list: 'upcoming' },
  ],
  tv: [
    { id: 'discover', label: 'Discover' },
    { id: 'top', label: 'Top rated', list: 'top_rated' },
    { id: 'now', label: 'On the air', list: 'on_the_air' },
    { id: 'upcoming', label: 'Airing today', list: 'airing_today' },
  ],
};

const SORTS: { id: string; label: string }[] = [
  { id: 'popular', label: 'Most popular' },
  { id: 'rated', label: 'Highest rated' },
  { id: 'newest', label: 'Newest first' },
];

const YEARS = Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() + 1 - i));

const sortParam = (type: MediaType, sort: string) => {
  if (sort === 'rated') return 'vote_average.desc';
  if (sort === 'newest') return type === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc';
  return 'popularity.desc';
};

export function CatalogPage({ type }: { type: MediaType }) {
  const [params, setParams] = useSearchParams();
  const genre = Number(params.get('genre')) || 0;
  const sort = params.get('sort') ?? 'popular';
  const year = params.get('year') ?? '';
  const collection = params.get('collection') ?? 'discover';
  const filter = params.get('q') ?? '';
  const isDiscover = collection === 'discover';
  const label = type === 'movie' ? 'Films' : 'TV shows';
  useTitle(label);

  const update = useCallback(
    (patch: Record<string, string | undefined>) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  const genres = useAsync(() => getGenres(type), [type]);
  const genreName = genres.data?.find((g) => g.id === genre)?.name;
  useTitle(genreName ? `${genreName} ${label}` : label);

  const fetchPage = useCallback(
    (page: number) => {
      if (isDiscover) {
        return discover(type, {
          genre: genre || undefined,
          sort: sortParam(type, sort),
          year: year || undefined,
          minVotes: sort === 'rated' ? 300 : undefined,
          page,
        });
      }
      const list = COLLECTIONS[type].find((c) => c.id === collection)?.list ?? 'popular';
      return getList(type, list, page);
    },
    [type, genre, sort, year, collection, isDiscover],
  );

  const feed = useInfinite<Title>(fetchPage, [fetchPage]);

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return feed.items.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (!isDiscover) {
        if (genre && !t.genreIds.includes(genre)) return false;
        if (year && t.year !== year) return false;
      }
      return true;
    });
  }, [feed.items, filter, isDiscover, genre, year]);

  if (!TMDB_KEY) return <SetupNotice />;

  return (
    <>
      <section className="page-head container">
        <Reveal>
          <p className="eyebrow">{type === 'movie' ? 'Movies' : 'Television'}</p>
          <h1 className="display">
            {genreName ? <>{genreName} <em>{label.toLowerCase()}</em></> : <>{label.replace('TV shows', 'Series')} <em>{type === 'movie' ? 'worth your evening' : 'worth a season'}</em></>}
          </h1>
          <p className="page-head__count">
            {feed.total ? `${feed.total.toLocaleString('en-US')} titles` : feed.loading ? 'Loading titles' : 'No titles match these filters'}
          </p>
        </Reveal>
      </section>

      <div className="container">
        <div className="toolbar">
          <div className="segmented segmented--wrap" role="tablist" aria-label="Collection">
            {COLLECTIONS[type].map((c) => (
              <button key={c.id} role="tab" aria-selected={collection === c.id} className={collection === c.id ? 'is-on' : ''} onClick={() => update({ collection: c.id === 'discover' ? undefined : c.id })}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="toolbar__controls">
            <label className="select">
              <span className="sr">Sort</span>
              <select value={sort} disabled={!isDiscover} onChange={(e) => update({ sort: e.target.value === 'popular' ? undefined : e.target.value })}>
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="select">
              <span className="sr">Year</span>
              <select value={year} onChange={(e) => update({ year: e.target.value || undefined })}>
                <option value="">Any year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <label className="field field--search">
              <Search size={15} />
              <input type="search" placeholder="Filter this category" value={filter} onChange={(e) => update({ q: e.target.value || undefined })} aria-label="Filter titles in this category" />
              {filter && (
                <button type="button" aria-label="Clear filter" onClick={() => update({ q: undefined })}>
                  <X size={14} />
                </button>
              )}
            </label>
          </div>
        </div>

        <div className="chips chips--scroll" role="list" aria-label="Genres">
          <button role="listitem" className={`chip ${!genre ? 'is-on' : ''}`} onClick={() => update({ genre: undefined })}>
            All genres
          </button>
          {(genres.data ?? []).map((g) => (
            <button key={g.id} role="listitem" className={`chip ${genre === g.id ? 'is-on' : ''}`} onClick={() => update({ genre: String(g.id) })}>
              {g.name}
            </button>
          ))}
        </div>

        {feed.error ? (
          <ErrorState error={feed.error} />
        ) : feed.loading && !feed.items.length ? (
          <div className="grid">
            <PosterSkeleton count={18} />
          </div>
        ) : shown.length === 0 ? (
          <Empty title="Nothing here yet" text="Try another genre, year or collection." action={{ label: 'Clear filters', to: type === 'movie' ? '/movies' : '/tv' }} />
        ) : (
          <div className="grid">
            {shown.map((t, i) => (
              <PosterCard key={t.key} title={t} index={i % 12} />
            ))}
            {feed.loading && <PosterSkeleton count={6} />}
          </div>
        )}

        {feed.hasMore && !feed.error && (
          <div className="more">
            <button className="btn btn--ghost" onClick={feed.loadMore} disabled={feed.loading}>
              {feed.loading ? 'Loading…' : 'Load more titles'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
