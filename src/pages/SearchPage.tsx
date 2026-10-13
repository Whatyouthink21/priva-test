import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { getGenres, getTrending, searchMulti, searchPerson, searchType, type MediaType, type Title, type SearchPerson } from '../lib/tmdb';
import { useAsync } from '../hooks/useAsync';
import { useInfinite } from '../hooks/useInfinite';
import { useTitle } from '../hooks/useTitle';
import { PosterCard, PosterSkeleton } from '../components/PosterCard';
import { PersonCard } from '../components/PersonCard';
import { Empty, ErrorState, SetupNotice } from '../components/States';
import { TMDB_KEY } from '../config';
import { paths } from '../lib/routes';

type Tab = 'all' | 'movie' | 'tv' | 'person';
const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Films' },
  { id: 'tv', label: 'TV shows' },
  { id: 'person', label: 'People' },
];

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const tab = (params.get('type') as Tab) || 'all';
  const genre = Number(params.get('genre')) || 0;
  const [input, setInput] = useState(q);
  useTitle(q ? `Search: ${q}` : 'Search');

  // Keep the box in sync with the URL (back/forward, category links).
  useEffect(() => setInput(q), [q]);

  // Debounce typing into the URL so search lives on its own, shareable page.
  useEffect(() => {
    if (input.trim() === q) return;
    const t = window.setTimeout(() => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (input.trim()) next.set('q', input.trim());
          else next.delete('q');
          return next;
        },
        { replace: true },
      );
    }, 350);
    return () => window.clearTimeout(t);
  }, [input, q, setParams]);

  const setTab = (t: Tab) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (t === 'all') next.delete('type');
      else next.set('type', t);
      return next;
    });

  const setGenre = (g: number) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (g) next.set('genre', String(g));
      else next.delete('genre');
      return next;
    });

  const genres = useAsync(async () => {
    const [m, t] = await Promise.all([getGenres('movie'), getGenres('tv')]);
    const seen = new Map<string, { id: number; name: string; type: MediaType }>();
    [...m.map((g) => ({ ...g, type: 'movie' as MediaType })), ...t.map((g) => ({ ...g, type: 'tv' as MediaType }))].forEach((g) => {
      if (!seen.has(g.name)) seen.set(g.name, g);
    });
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const trending = useAsync(() => getTrending('all', 'week'), []);

  const titleFetch = useCallback(
    (page: number) => {
      if (tab === 'movie') return searchType('movie', q, page);
      if (tab === 'tv') return searchType('tv', q, page);
      return searchMulti(q, page);
    },
    [q, tab],
  );
  const titles = useInfinite<Title>(titleFetch, [titleFetch], tab !== 'person' && !!q);

  const personFetch = useCallback((page: number) => searchPerson(q, page), [q]);
  const people = useInfinite<SearchPerson>(personFetch, [personFetch], tab === 'person' && !!q);
  const peekPeople = useInfinite<SearchPerson>(personFetch, [personFetch], tab === 'all' && !!q);

  const shown = useMemo(
    () => (genre ? titles.items.filter((t) => t.genreIds.includes(genre)) : titles.items),
    [titles.items, genre],
  );

  if (!TMDB_KEY) return <SetupNotice />;

  const genreName = genres.data?.find((g) => g.id === genre)?.name;
  const hasQuery = q.length > 0;

  return (
    <>
      <section className="search-hero container">
        <p className="eyebrow">Search</p>
        <h1 className="display">{hasQuery ? <>Results for <em>“{q}”</em></> : <>What are you <em>in the mood</em> for?</>}</h1>
        <label className="search-input">
          <Search size={22} />
          <input
            autoFocus
            type="search"
            placeholder="Titles, people, or keywords"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Search titles and people"
          />
          {input && (
            <button type="button" aria-label="Clear search" onClick={() => setInput('')}>
              <X size={18} />
            </button>
          )}
        </label>
        <div className="segmented segmented--wrap" role="tablist" aria-label="Result type">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'is-on' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <div className="container">
        {hasQuery && (genres.data?.length ?? 0) > 0 && tab !== 'person' && (
          <div className="chips chips--scroll" role="list" aria-label="Filter by category">
            <button role="listitem" className={`chip ${!genre ? 'is-on' : ''}`} onClick={() => setGenre(0)}>
              Any category
            </button>
            {genres.data!.map((g) => (
              <button key={`${g.name}`} role="listitem" className={`chip ${genre === g.id ? 'is-on' : ''}`} onClick={() => setGenre(g.id)}>
                {g.name}
              </button>
            ))}
          </div>
        )}

        {!hasQuery && (
          <>
            <section className="section section--tight">
              <p className="eyebrow">Browse by category</p>
              <div className="chips chips--cloud" role="list">
                {(genres.data ?? []).map((g) => (
                  <Link key={g.name} role="listitem" className="chip chip--link" to={`${paths.browse(g.type)}?genre=${g.id}`}>
                    {g.name}
                  </Link>
                ))}
              </div>
            </section>
            <section className="section section--tight">
              <p className="eyebrow">Trending this week</p>
              <div className="grid">
                {trending.loading && !trending.data ? (
                  <PosterSkeleton count={12} />
                ) : (
                  (trending.data?.items ?? []).slice(0, 12).map((t, i) => <PosterCard key={t.key} title={t} index={i} />)
                )}
              </div>
            </section>
          </>
        )}

        {hasQuery && (
          <>
            {genreName && <p className="result-note">Showing {genreName.toLowerCase()} titles from this search.</p>}

            {tab === 'person' ? (
              <PeopleGrid feed={people} />
            ) : (
              <>
                {tab === 'all' && peekPeople.items.length > 0 && (
                  <section className="section section--tight">
                    <p className="eyebrow">People</p>
                    <div className="people-strip">
                      {peekPeople.items.slice(0, 8).map((p) => (
                        <PersonCard key={p.id} id={p.id} name={p.name} sub={p.knownFor.slice(0, 2).join(' · ') || p.department} profile={p.profile} />
                      ))}
                    </div>
                  </section>
                )}
                <section className="section section--tight">
                  {tab === 'all' && <p className="eyebrow">Titles</p>}
                  {titles.error ? (
                    <ErrorState error={titles.error} />
                  ) : titles.loading && !titles.items.length ? (
                    <div className="grid"><PosterSkeleton count={12} /></div>
                  ) : shown.length === 0 ? (
                    <Empty title="No titles found" text={`Nothing matched “${q}”${genreName ? ` in ${genreName}` : ''}. Try a shorter word or another category.`} />
                  ) : (
                    <>
                      <p className="result-count">{titles.total.toLocaleString('en-US')} matches</p>
                      <div className="grid">
                        {shown.map((t, i) => (
                          <PosterCard key={t.key} title={t} index={i % 12} />
                        ))}
                      </div>
                    </>
                  )}
                  {titles.hasMore && !titles.error && (
                    <div className="more">
                      <button className="btn btn--ghost" onClick={titles.loadMore} disabled={titles.loading}>
                        {titles.loading ? 'Loading…' : 'Load more'}
                      </button>
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

function PeopleGrid({ feed }: { feed: ReturnType<typeof useInfinite<SearchPerson>> }) {
  if (feed.error) return <ErrorState error={feed.error} />;
  if (feed.loading && !feed.items.length) return <div className="people-grid"><PosterSkeleton count={10} /></div>;
  if (!feed.items.length) return <Empty title="No people found" />;
  return (
    <>
      <div className="people-grid">
        {feed.items.map((p) => (
          <PersonCard key={p.id} id={p.id} name={p.name} sub={p.knownFor.slice(0, 2).join(' · ') || p.department} profile={p.profile} />
        ))}
      </div>
      {feed.hasMore && (
        <div className="more">
          <button className="btn btn--ghost" onClick={feed.loadMore} disabled={feed.loading}>Load more</button>
        </div>
      )}
    </>
  );
}
