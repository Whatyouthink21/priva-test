import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, User } from 'lucide-react';
import { getPerson } from '../lib/tmdb';
import { useAsync } from '../hooks/useAsync';
import { useTitle } from '../hooks/useTitle';
import { parseId, longDate } from '../lib/format';
import { PosterCard, PosterSkeleton } from '../components/PosterCard';
import { ErrorState, Loading, Empty, SetupNotice } from '../components/States';
import { Reveal } from '../components/Reveal';
import { TMDB_KEY } from '../config';

export function PersonPage() {
  const params = useParams();
  const id = parseId(params.id);
  const state = useAsync(() => getPerson(id), [id]);
  const [filter, setFilter] = useState<'all' | 'acting' | 'crew'>('all');
  const [bioOpen, setBioOpen] = useState(false);
  useTitle(state.data?.name);

  const films = useMemo(() => {
    if (!state.data) return [];
    if (filter === 'acting') return state.data.films.filter((f) => f.acting);
    if (filter === 'crew') return state.data.films.filter((f) => !f.acting);
    return state.data.films;
  }, [state.data, filter]);

  if (!TMDB_KEY) return <SetupNotice />;
  if (state.error) return <div className="container section"><ErrorState error={state.error} /></div>;
  if (!state.data) return <div className="container section"><Loading label="Loading profile" /></div>;
  const p = state.data;
  const bioLong = p.biography.length > 520;

  return (
    <div className="person">
      <header className="person-hero container">
        <div className="person-hero__photo">
          {p.profile ? <img src={p.profile} alt={p.name} /> : <User size={48} />}
        </div>
        <div className="person-hero__info">
          <p className="eyebrow">{p.department || 'Film & TV'}</p>
          <h1 className="display">{p.name}</h1>
          <dl className="facts facts--inline">
            {p.birthday && <div><dt>Born</dt><dd>{longDate(p.birthday)}{p.placeOfBirth ? `, ${p.placeOfBirth}` : ''}</dd></div>}
            {p.deathday && <div><dt>Died</dt><dd>{longDate(p.deathday)}</dd></div>}
            <div><dt>Credits</dt><dd>{p.films.length} titles</dd></div>
          </dl>
          {p.biography ? (
            <>
              <p className={`person-hero__bio ${bioOpen || !bioLong ? 'is-open' : ''}`}>{p.biography}</p>
              {bioLong && (
                <button className="link-btn" onClick={() => setBioOpen((o) => !o)}>
                  {bioOpen ? 'Show less' : 'Read more'}
                </button>
              )}
            </>
          ) : (
            <p className="muted">No biography available.</p>
          )}
          <div className="person-hero__links">
            {p.imdbId && (
              <a className="btn btn--ghost" href={`https://www.imdb.com/name/${p.imdbId}/`} target="_blank" rel="noreferrer">
                IMDb <ExternalLink size={14} />
              </a>
            )}
            {p.homepage && (
              <a className="btn btn--ghost" href={p.homepage} target="_blank" rel="noreferrer">Website <ExternalLink size={14} /></a>
            )}
          </div>
        </div>
      </header>

      <section className="container section">
        <Reveal>
          <header className="section-head">
            <div>
              <p className="eyebrow">Filmography</p>
              <h2>Known for</h2>
            </div>
            <div className="segmented" role="tablist" aria-label="Role">
              {(['all', 'acting', 'crew'] as const).map((f) => (
                <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : f === 'acting' ? 'Acting' : 'Crew'}
                </button>
              ))}
            </div>
          </header>
        </Reveal>
        {films.length === 0 ? (
          <Empty title="No credits in this view" />
        ) : (
          <div className="grid">
            {films.slice(0, 120).map((f, i) => (
              <PosterCard key={f.title.key} title={f.title} index={i % 12} note={f.role ? `${f.role}${f.title.year ? ` · ${f.title.year}` : ''}` : f.title.year} />
            ))}
          </div>
        )}
        {!state.data && <div className="grid"><PosterSkeleton count={12} /></div>}
        {films.length > 120 && <p className="muted small center">Showing the 120 most recent credits.</p>}
      </section>
    </div>
  );
}
