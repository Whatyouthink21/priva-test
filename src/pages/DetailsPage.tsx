import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Clapperboard, Download, Play, Tv, Users } from 'lucide-react';
import {
  getDetails,
  getProviderRegions,
  getSeason,
  getWatchProviders,
  type Details,
  type Episode,
  type MediaType,
  type Title,
  type WatchProvider,
} from '../lib/tmdb';
import { useAsync } from '../hooks/useAsync';
import { useTitle } from '../hooks/useTitle';
import { parseId, longDate, money, runtime, year } from '../lib/format';
import { paths, watchOf } from '../lib/routes';
import { ListButton } from '../components/ListButton';
import { ImdbScore, TmdbScore } from '../components/RatingBadges';
import { TrailerModal } from '../components/TrailerModal';
import { BackdropVideo } from '../components/BackdropVideo';
import { PersonCard } from '../components/PersonCard';
import { Rail } from '../components/Rail';
import { PosterCard } from '../components/PosterCard';
import { ErrorState, Loading, SetupNotice } from '../components/States';
import { Reveal } from '../components/Reveal';
import { SOURCES } from '../lib/players';
import { DOWNLOAD_SOURCES } from '../lib/downloads';
import { TMDB_KEY } from '../config';

export function DetailsPage({ type }: { type: MediaType }) {
  const params = useParams();
  const id = parseId(params.id);
  const state = useAsync(() => getDetails(type, id), [type, id]);
  const d = state.data;
  useTitle(d?.title);
  const [trailer, setTrailer] = useState(false);

  if (!TMDB_KEY) return <SetupNotice />;
  if (state.error) return <div className="container section"><ErrorState error={state.error} /></div>;
  if (!d) return <div className="container section"><Loading label="Loading title" /></div>;

  const director = d.crew.find((c) => c.job === 'Director');
  const writers = d.crew.filter((c) => ['Screenplay', 'Writer', 'Story'].includes(c.job ?? '')).slice(0, 3);
  const isTv = type === 'tv';

  return (
    <article className="details">
      <header className="details__hero">
        {d.backdrop && <img className="details__backdrop" src={d.backdrop} alt="" />}
        {d.trailer && <BackdropVideo videoKey={d.trailer} delay={1500} start={8} className="details__video" />}
        <div className="details__veil" />
        <div className="container details__grid">
          <div className="details__poster">
            {d.poster ? <img src={d.poster} alt={`${d.title} poster`} /> : <div className="poster__fallback">{d.title}</div>}
          </div>
          <div className="details__info">
            <p className="eyebrow details__enter" style={{ '--d': '0ms' } as React.CSSProperties}>
              {isTv ? 'Series' : 'Film'}
              {d.certification && <> · <span className="cert">{d.certification}</span></>}
              {d.status && <> · {d.status}</>}
            </p>
            <h1 className="details__title details__enter" style={{ '--d': '70ms' } as React.CSSProperties}>
              {d.title}
              {d.year && <span className="details__year"> {d.year}</span>}
            </h1>
            {d.tagline && <p className="details__tagline details__enter" style={{ '--d': '120ms' } as React.CSSProperties}>{d.tagline}</p>}
            <div className="details__meta details__enter" style={{ '--d': '170ms' } as React.CSSProperties}>
              {isTv ? (
                <span>{d.seasons.length} season{d.seasons.length === 1 ? '' : 's'} · {d.numberOfEpisodes} episodes</span>
              ) : (
                runtime(d.runtime) && <span>{runtime(d.runtime)}</span>
              )}
              {d.genres.map((g) => (
                <Link key={g.id} to={`${paths.browse(type)}?genre=${g.id}`} className="tag">
                  {g.name}
                </Link>
              ))}
            </div>
            <div className="ratings details__enter" style={{ '--d': '220ms' } as React.CSSProperties}>
              <TmdbScore value={d.rating} votes={d.votes} />
              <ImdbScore imdbId={d.imdbId} />
            </div>
            <div className="details__actions details__enter" style={{ '--d': '270ms' } as React.CSSProperties}>
              <Link className="btn btn--primary" to={watchOf(d)}>
                <Play size={17} fill="currentColor" /> {isTv ? 'Play S1 · E1' : 'Play'}
              </Link>
              {d.trailer && (
                <button className="btn btn--ghost" onClick={() => setTrailer(true)}>
                  <Clapperboard size={17} /> Trailer
                </button>
              )}
              <ListButton title={d as Title} />
            </div>
            <p className="details__overview details__enter" style={{ '--d': '320ms' } as React.CSSProperties}>{d.overview || 'No synopsis available yet.'}</p>
            <dl className="facts details__enter" style={{ '--d': '360ms' } as React.CSSProperties}>
              {director && (<div><dt>Director</dt><dd><Link to={paths.person(director.id, director.name)}>{director.name}</Link></dd></div>)}
              {!director && d.creators.length > 0 && (<div><dt>Created by</dt><dd>{d.creators.map((c) => c.name).join(', ')}</dd></div>)}
              {writers.length > 0 && (<div><dt>Writing</dt><dd>{writers.map((w) => w.name).join(', ')}</dd></div>)}
              {isTv && d.networks.length > 0 && (<div><dt>Network</dt><dd>{d.networks.map((n) => n.name).join(', ')}</dd></div>)}
              {!isTv && <div><dt>Release</dt><dd>{longDate(d.date)}</dd></div>}
              {!isTv && d.budget > 0 && <div><dt>Budget</dt><dd>{money(d.budget)}</dd></div>}
              {!isTv && d.revenue > 0 && <div><dt>Box office</dt><dd>{money(d.revenue)}</dd></div>}
              {d.spokenLanguages.length > 0 && <div><dt>Languages</dt><dd>{d.spokenLanguages.join(', ')}</dd></div>}
              {d.countries.length > 0 && <div><dt>Origin</dt><dd>{d.countries.join(', ')}</dd></div>}
            </dl>
          </div>
        </div>
      </header>

      <div className="container details__body">
        <StreamsPanel d={d} />

        <ProvidersPanel d={d} />

        <DownloadsPanel d={d} />

        {isTv && <SeasonsPanel d={d} />}

        <section className="section">
          <Reveal>
            <header className="section-head">
              <div>
                <p className="eyebrow">Cast</p>
                <h2>Starring</h2>
              </div>
              <Link to={paths.cast(type, d.id)} className="link-arrow">
                Full cast &amp; crew <ChevronRight size={15} />
              </Link>
            </header>
          </Reveal>
          <div className="people-strip">
            {d.cast.slice(0, 12).map((p) => (
              <PersonCard key={`${p.id}-${p.character}`} id={p.id} name={p.name} sub={p.character} profile={p.profile} />
            ))}
          </div>
        </section>

        {d.recommendations.length > 0 && (
          <Rail eyebrow="More like this" title="Recommendations">
            {d.recommendations.slice(0, 20).map((t, i) => <PosterCard key={t.key} title={t} index={i} />)}
          </Rail>
        )}
        {d.similar.length > 0 && (
          <Rail eyebrow="Similar" title="You might also like">
            {d.similar.slice(0, 20).map((t, i) => <PosterCard key={t.key} title={t} index={i} />)}
          </Rail>
        )}
      </div>

      {trailer && d.trailer && <TrailerModal videoKey={d.trailer} title={d.title} onClose={() => setTrailer(false)} />}
    </article>
  );
}

function StreamsPanel({ d }: { d: Details }) {
  const isTv = d.type === 'tv';
  const base = isTv ? paths.watch('tv', d.id, 1, 1) : paths.watch('movie', d.id);
  return (
    <section className="section streams" id="streams">
      <Reveal>
        <header className="section-head">
          <div>
            <p className="eyebrow">Streams</p>
            <h2>Choose a source</h2>
          </div>
          <p className="muted small">If one source stalls, switch to another. Each opens in the player.</p>
        </header>
      </Reveal>
      <div className="streams__grid">
        {SOURCES.map((s, i) => (
          <Link key={s.id} to={`${base}?server=${s.param}`} className="stream" style={{ '--i': i } as React.CSSProperties}>
            <span className="stream__num">0{i + 1}</span>
            <span className="stream__body">
              <b>{s.label}</b>
              <small>{s.note}</small>
            </span>
            <Play size={16} fill="currentColor" className="stream__play" />
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------- where to watch ---------- */

const REGION_KEY = 'priva:region';
const FALLBACK_LINK = (type: MediaType, id: number, region: string) =>
  `https://www.themoviedb.org/${type}/${id}/watch?locale=${region}`;

function storedRegion(): string {
  try {
    const saved = localStorage.getItem(REGION_KEY);
    if (saved) return saved;
  } catch {
    /* storage unavailable */
  }
  const parts = (typeof navigator !== 'undefined' ? navigator.language : '').split('-');
  const code = parts[1]?.toUpperCase();
  return code && code.length === 2 ? code : 'US';
}

function regionLabel(code: string): string {
  try {
    return new Intl.DisplayNames([typeof navigator !== 'undefined' ? navigator.language : 'en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

function ProvidersPanel({ d }: { d: Details }) {
  const [region, setRegion] = useState(storedRegion);
  const regions = useAsync(() => getProviderRegions(), []);
  const state = useAsync(() => getWatchProviders(d.type, d.id), [d.type, d.id]);
  const current = state.data?.[region] ?? null;
  const link = current?.link || FALLBACK_LINK(d.type, d.id, region);

  const groups = useMemo(() => {
    if (!current) return [];
    return [
      { id: 'stream', label: 'Included with a subscription', items: current.flatrate },
      { id: 'free', label: 'Free with ads', items: [...current.free, ...current.ads] },
      { id: 'rent', label: 'Rent', items: current.rent },
      { id: 'buy', label: 'Buy', items: current.buy },
    ].filter((g) => g.items.length > 0);
  }, [current]);

  const options = useMemo(() => {
    const list = regions.data ?? [];
    if (region && !list.some((r) => r.code === region)) return [{ code: region, name: regionLabel(region) }, ...list];
    return list;
  }, [regions.data, region]);

  const choose = (code: string) => {
    setRegion(code);
    try {
      localStorage.setItem(REGION_KEY, code);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="section providers" id="providers">
      <Reveal>
        <header className="section-head">
          <div>
            <p className="eyebrow">Where to watch</p>
            <h2>Streaming providers</h2>
          </div>
          <label className="select select--region">
            <span className="sr">Country</span>
            <select value={region} onChange={(e) => choose(e.target.value)} aria-label="Country for provider availability">
              {options.map((r) => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
          </label>
        </header>
      </Reveal>

      {state.error ? (
        <p className="muted small">Provider data is unavailable right now.</p>
      ) : state.loading && !state.data ? (
        <div className="providers__row">
          {Array.from({ length: 5 }, (_, i) => <div key={i} className="provider provider--skeleton skeleton" />)}
        </div>
      ) : groups.length === 0 ? (
        <p className="muted">
          No subscription, rental or purchase option listed for {regionLabel(region)}.{' '}
          <a className="link-arrow" href={link} target="_blank" rel="noopener noreferrer">
            Check availability <ChevronRight size={14} />
          </a>
        </p>
      ) : (
        <>
          {groups.map((g) => (
            <div key={g.id} className="providers__group">
              <p className="providers__label">{g.label}</p>
              <div className="providers__row">
                {g.items.map((p: WatchProvider) => (
                  <a key={`${g.id}-${p.id}`} className="provider" href={link} target="_blank" rel="noopener noreferrer" title={`${p.name} — ${g.label.toLowerCase()}`}>
                    {p.logo ? <img src={p.logo} alt="" loading="lazy" /> : <span className="provider__mono">{p.name.slice(0, 2)}</span>}
                    <b>{p.name}</b>
                  </a>
                ))}
              </div>
            </div>
          ))}
          <p className="providers__credit">
            Availability data from JustWatch, via TMDB · {regionLabel(region)}
          </p>
        </>
      )}
    </section>
  );
}

/* ---------- download ---------- */

function DownloadsPanel({ d }: { d: Details }) {
  const isTv = d.type === 'tv';
  const target = isTv ? { type: d.type, id: d.id, season: 1, episode: 1 } : { type: d.type, id: d.id };
  return (
    <section className="section downloads" id="downloads">
      <Reveal>
        <header className="section-head">
          <div>
            <p className="eyebrow">Downloads</p>
            <h2>Save a copy</h2>
          </div>
          <p className="muted small">
            Opens a third-party download page in a new tab{isTv ? ' — pick the season and episode there' : ''}.
          </p>
        </header>
      </Reveal>
      <div className="streams__grid">
        {DOWNLOAD_SOURCES.map((s, i) => (
          <a
            key={s.id}
            className="stream download"
            style={{ '--i': i } as React.CSSProperties}
            href={s.build(target)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="stream__num">0{i + 1}</span>
            <span className="stream__body">
              <b>{s.label}</b>
              <small>{s.note}</small>
            </span>
            <Download size={16} className="stream__play" />
          </a>
        ))}
      </div>
    </section>
  );
}

function SeasonsPanel({ d }: { d: Details }) {
  const seasons = d.seasons;
  const [selected, setSelected] = useState(seasons[0]?.seasonNumber ?? 1);
  const episodes = useAsync(() => getSeason(d.id, selected), [d.id, selected]);
  const current = useMemo(() => seasons.find((s) => s.seasonNumber === selected), [seasons, selected]);
  if (!seasons.length) return null;
  return (
    <section className="section">
      <Reveal>
        <header className="section-head">
          <div>
            <p className="eyebrow">Episodes</p>
            <h2>{current?.name ?? `Season ${selected}`}</h2>
          </div>
          <div className="season-picker" role="tablist" aria-label="Seasons">
            {seasons.map((s) => (
              <button key={s.id} role="tab" aria-selected={s.seasonNumber === selected} className={s.seasonNumber === selected ? 'is-on' : ''} onClick={() => setSelected(s.seasonNumber)}>
                S{s.seasonNumber}
              </button>
            ))}
          </div>
        </header>
      </Reveal>
      {episodes.error ? (
        <ErrorState error={episodes.error} />
      ) : episodes.loading && !episodes.data ? (
        <div className="episode-list">{Array.from({ length: 4 }, (_, i) => <div key={i} className="episode skeleton" />)}</div>
      ) : (
        <div className="episode-list">
          {(episodes.data ?? []).map((e: Episode, i) => (
            <Link key={e.id} to={paths.watch('tv', d.id, selected, e.number)} className="episode" style={{ '--i': i } as React.CSSProperties}>
              <span className="episode__still">
                {e.still ? <img src={e.still} alt="" loading="lazy" /> : <Tv size={22} />}
                <span className="episode__play"><Play size={16} fill="currentColor" /></span>
              </span>
              <span className="episode__body">
                <small>Episode {e.number}{e.runtime ? ` · ${runtime(e.runtime)}` : ''}{e.airDate ? ` · ${year(e.airDate)}` : ''}</small>
                <b>{e.name}</b>
                <span className="episode__overview">{e.overview || 'No description yet.'}</span>
              </span>
            </Link>
          ))}
          {episodes.data?.length === 0 && <p className="muted">No episodes listed for this season yet.</p>}
        </div>
      )}
    </section>
  );
}

export function CastPage({ type }: { type: MediaType }) {
  const params = useParams();
  const id = parseId(params.id);
  const state = useAsync(() => getDetails(type, id), [type, id]);
  useTitle(state.data ? `Cast · ${state.data.title}` : 'Cast');
  if (!TMDB_KEY) return <SetupNotice />;
  if (state.error) return <div className="container section"><ErrorState error={state.error} /></div>;
  if (!state.data) return <div className="container section"><Loading label="Loading cast" /></div>;
  const d = state.data;

  const byDept = d.crew.reduce<Record<string, typeof d.crew>>((acc, c) => {
    const key = c.department || 'Crew';
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="cast-page">
      <header className="cast-page__head">
        {d.backdrop && <img src={d.backdrop} alt="" />}
        <div className="cast-page__veil" />
        <div className="container cast-page__inner">
          <Link to={paths.details(type, d.id, d.title)} className="back-link">← {d.title}</Link>
          <p className="eyebrow">Cast &amp; crew</p>
          <h1 className="display">{d.title}</h1>
          <p className="muted">{d.cast.length} cast · {d.crew.length} crew</p>
        </div>
      </header>
      <div className="container section">
        <Reveal>
          <header className="section-head"><div><p className="eyebrow">Cast</p><h2><Users size={22} className="inline-icon" /> Actors</h2></div></header>
        </Reveal>
        <div className="people-grid">
          {d.cast.map((p, i) => (
            <div key={`${p.id}-${i}`} style={{ '--i': i % 12 } as React.CSSProperties} className="stagger">
              <PersonCard id={p.id} name={p.name} sub={p.character} profile={p.profile} />
            </div>
          ))}
        </div>
        {Object.keys(byDept).length > 0 && (
          <>
            <Reveal>
              <header className="section-head section-head--gap"><div><p className="eyebrow">Crew</p><h2>Behind the camera</h2></div></header>
            </Reveal>
            {Object.entries(byDept).map(([dept, members]) => (
              <section key={dept} className="crew-group">
                <h3>{dept}</h3>
                <div className="people-grid">
                  {members.map((p, i) => (
                    <PersonCard key={`${p.id}-${p.job}-${i}`} id={p.id} name={p.name} sub={p.job} profile={p.profile} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

