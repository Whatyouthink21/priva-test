import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Share2, Check } from 'lucide-react';
import { getDetails, getSeason, type Episode, type MediaType } from '../lib/tmdb';
import { useAsync } from '../hooks/useAsync';
import { useTitle } from '../hooks/useTitle';
import { useLibrary } from '../context/LibraryContext';
import { parseId, runtime, year } from '../lib/format';
import { paths } from '../lib/routes';
import { SOURCES, sourceById } from '../lib/players';
import { Loading, ErrorState, SetupNotice } from '../components/States';
import { Logo } from '../components/Logo';
import { TMDB_KEY } from '../config';

// Origins whose messages we trust for playback progress.
const PLAYER_ORIGINS = ['https://tgvid.lovable.app', 'https://vidsrc.mov'];
const SAVE_EVERY_MS = 15000;

function readNumber(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

export function WatchPage({ type }: { type: MediaType }) {
  const params = useParams();
  const id = parseId(params.id);
  const season = type === 'tv' ? parseId(params.season) || 1 : 1;
  const episode = type === 'tv' ? parseId(params.episode) || 1 : 1;
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const { trackWatch } = useLibrary();

  const details = useAsync(() => getDetails(type, id), [type, id]);
  const d = details.data;
  const seasonData = useAsync(
    () => (type === 'tv' ? getSeason(id, season) : Promise.resolve([] as Episode[])),
    [type, id, season],
  );

  // Source: URL wins, otherwise the last one the viewer picked.
  const [sourceId, setSourceId] = useState(() => sourceById(search.get('server') ?? localStorage.getItem('priva:source')).id);
  useEffect(() => {
    const requested = search.get('server');
    if (requested) setSourceId(sourceById(requested).id);
  }, [search]);
  const source = sourceById(sourceId);
  const chooseSource = (sid: string) => {
    setSourceId(sid);
    localStorage.setItem('priva:source', sid);
    setSearch((prev) => {
      const next = new URLSearchParams(prev);
      next.set('server', sid === 'priva' ? 'first' : sid);
      return next;
    }, { replace: true });
  };

  // Episode currently reported by the player (may move on by itself with autoplay-next).
  const [live, setLive] = useState({ season, episode });
  useEffect(() => setLive({ season, episode }), [season, episode]);

  const src = useMemo(() => source.build({ type, id, season, episode }), [source, type, id, season, episode]);
  useTitle(d ? (type === 'tv' ? `${d.title} · S${season}E${episode}` : `${d.title} · Watch`) : 'Watch');

  /* ----- progress tracking ----- */
  const trackRef = useRef(trackWatch);
  trackRef.current = trackWatch;
  const lastSave = useRef(0);

  const base = useMemo(
    () => (d ? { type, tmdbId: id, title: d.title, poster: d.poster, backdrop: d.backdrop } : null),
    [d, type, id],
  );

  useEffect(() => {
    if (!base) return;
    const episodeName = type === 'tv' ? seasonData.data?.find((e) => e.number === episode)?.name : undefined;
    trackRef.current({ ...base, season: type === 'tv' ? season : undefined, episode: type === 'tv' ? episode : undefined, episodeTitle: episodeName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, season, episode, seasonData.data]);

  useEffect(() => {
    if (!base) return;
    const onMessage = (e: MessageEvent) => {
      if (!PLAYER_ORIGINS.includes(e.origin)) return;
      let data: unknown = e.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || typeof data !== 'object') return;
      const payload = ((data as { data?: unknown }).data ?? data) as Record<string, unknown>;

      const s = readNumber(payload, ['season']);
      const ep = readNumber(payload, ['episode']);
      if (s && ep) setLive((cur) => (cur.season === s && cur.episode === ep ? cur : { season: s, episode: ep }));

      const current = readNumber(payload, ['currentTime', 'time', 'position']);
      const duration = readNumber(payload, ['duration']);
      if (current === undefined || !duration) return;
      const now = Date.now();
      if (now - lastSave.current < SAVE_EVERY_MS) return;
      lastSave.current = now;
      trackRef.current({
        ...base,
        season: type === 'tv' ? s ?? season : undefined,
        episode: type === 'tv' ? ep ?? episode : undefined,
        position: Math.round(current),
        duration: Math.round(duration),
        percent: Math.min(100, (current / duration) * 100),
      });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [base, type, season, episode]);

  /* ----- navigation helpers ----- */
  const seasons = d?.seasons ?? [];
  const nextEpisode = useMemo(() => {
    if (type !== 'tv' || !seasonData.data) return null;
    const list = seasonData.data;
    const idx = list.findIndex((e) => e.number === episode);
    if (idx >= 0 && idx < list.length - 1) return { season, episode: list[idx + 1].number };
    const nextSeason = seasons.find((s) => s.seasonNumber === season + 1);
    return nextSeason ? { season: nextSeason.seasonNumber, episode: 1 } : null;
  }, [type, seasonData.data, episode, season, seasons]);
  const prevEpisode = useMemo(() => {
    if (type !== 'tv' || !seasonData.data) return null;
    const list = seasonData.data;
    const idx = list.findIndex((e) => e.number === episode);
    if (idx > 0) return { season, episode: list[idx - 1].number };
    if (season > 1) return { season: season - 1, episode: 1 };
    return null;
  }, [type, seasonData.data, episode, season]);

  const goEpisode = (s: number, e: number) => navigate({ pathname: paths.watch('tv', id, s, e), search: search.toString() });

  const [copied, setCopied] = useState(false);
  const share = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}#${paths.details(type, id, d?.title)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard not available */
    }
  }, [type, id, d?.title]);

  if (!TMDB_KEY) return <SetupNotice />;

  const backTo = type === 'movie' ? paths.details('movie', id, d?.title) : paths.details('tv', id, d?.title);

  return (
    <div className="watch">
      <header className="watch__bar">
        <div className="watch__bar-left">
          <button className="icon-btn icon-btn--plain" aria-label="Go back" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(backTo))}>
            <ArrowLeft size={20} />
          </button>
          <Logo compact />
          <div className="watch__titleblock">
            <span className="watch__title">{d?.title ?? 'Loading…'}</span>
            {type === 'tv' && <span className="watch__ep">Season {season} · Episode {episode}</span>}
          </div>
        </div>
        <div className="watch__bar-right">
          <div className="segmented segmented--sources" role="tablist" aria-label="Stream source">
            {SOURCES.map((s) => (
              <button key={s.id} role="tab" aria-selected={source.id === s.id} className={source.id === s.id ? 'is-on' : ''} onClick={() => chooseSource(s.id)} title={s.note}>
                {s.label}
              </button>
            ))}
          </div>
          <button className="icon-btn icon-btn--plain" onClick={share} aria-label="Copy link to this title" title="Copy link">
            {copied ? <Check size={18} /> : <Share2 size={18} />}
          </button>
        </div>
      </header>

      <div className="watch__stage">
        <div className="watch__player">
          <iframe
            key={src}
            src={src}
            title={`${d?.title ?? 'Video'} player`}
            width="100%"
            height="100%"
            frameBorder={0}
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>

      <div className="watch__below container">
        <div className="watch__info">
          {details.error && <ErrorState error={details.error} />}
          {!d && !details.error && <Loading label="Preparing player" />}
          {d && (
            <>
              <p className="eyebrow">{type === 'tv' ? `Now playing · S${season} E${episode}` : 'Now playing'}</p>
              <h1 className="watch__heading">{d.title}{d.year && <span> · {d.year}</span>}</h1>
              {type === 'tv' && seasonData.data?.find((e) => e.number === episode) && (
                <h2 className="watch__ep-title">{seasonData.data.find((e) => e.number === episode)?.name}</h2>
              )}
              <p className="watch__meta">{[runtime(d.runtime), d.genres.slice(0, 3).map((g) => g.name).join(' · ')].filter(Boolean).join('  ·  ')}</p>
              <p className="watch__overview">
                {type === 'tv' ? seasonData.data?.find((e) => e.number === episode)?.overview || d.overview : d.overview}
              </p>
              {type === 'tv' && (
                <div className="watch__nav">
                  <button className="btn btn--ghost" disabled={!prevEpisode} onClick={() => prevEpisode && goEpisode(prevEpisode.season, prevEpisode.episode)}>
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button className="btn btn--primary" disabled={!nextEpisode} onClick={() => nextEpisode && goEpisode(nextEpisode.season, nextEpisode.episode)}>
                    Next episode <ChevronRight size={16} />
                  </button>
                </div>
              )}
              <p className="watch__note">Not loading? Switch to another source above. Playback is served by the selected third-party player.</p>
            </>
          )}
        </div>

        {type === 'tv' && d && (
          <aside className="episodes" aria-label="Episodes">
            <div className="episodes__head">
              <span className="eyebrow">Season</span>
              <div className="season-picker season-picker--compact">
                {seasons.map((s) => (
                  <Link key={s.id} to={paths.watch('tv', id, s.seasonNumber, 1)} className={s.seasonNumber === season ? 'is-on' : ''} aria-current={s.seasonNumber === season}>
                    S{s.seasonNumber}
                  </Link>
                ))}
              </div>
            </div>
            <ol className="episodes__list">
              {(seasonData.data ?? []).map((e) => {
                const active = live.season === season && live.episode === e.number;
                return (
                  <li key={e.id}>
                    <Link to={paths.watch('tv', id, season, e.number)} className={`ep-row ${active ? 'is-active' : ''}`} aria-current={active}>
                      <span className="ep-row__num">{String(e.number).padStart(2, '0')}</span>
                      <span className="ep-row__body">
                        <b>{e.name}</b>
                        <small>{[e.runtime ? runtime(e.runtime) : '', e.airDate ? year(e.airDate) : ''].filter(Boolean).join(' · ')}</small>
                      </span>
                      {active ? <Play size={14} fill="currentColor" /> : null}
                    </Link>
                  </li>
                );
              })}
              {seasonData.loading && !seasonData.data && <li className="ep-row skeleton" />}
            </ol>
          </aside>
        )}
      </div>
    </div>
  );
}
