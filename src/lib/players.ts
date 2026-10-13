import { ACCENT } from '../config';
import type { MediaType } from './tmdb';

// Player sources. PRIVA Stream is the primary player; VidStuck is the backup
// documented at https://vidstuck.xyz (iframe embed, TMDB ids, URL parameters).

const PRIVA_PLAYER = 'https://tgvid.lovable.app';
const VIDSTUCK = 'https://vidstuck.xyz';

export interface PlayTarget {
  type: MediaType;
  id: number;
  season?: number;
  episode?: number;
}

export interface StreamSource {
  id: string;
  label: string;
  note: string;
  /** Value written to the `server` query parameter in the URL. */
  param: string;
  build: (t: PlayTarget) => string;
}

const hasEpisode = (t: PlayTarget) => t.type === 'tv';

const privaUrl = (t: PlayTarget, server?: string) => {
  const path = hasEpisode(t) ? `/embed/tv/${t.id}/${t.season ?? 1}/${t.episode ?? 1}` : `/embed/movie/${t.id}`;
  const params = new URLSearchParams({
    color: ACCENT,
    back: 'false',
    episodeSelector: 'false',
    autoplayNextEp: 'true',
  });
  if (server) params.set('server', server);
  return `${PRIVA_PLAYER}${path}?${params.toString()}`;
};

/** VidStuck embed — https://vidstuck.xyz/embed/movie/{tmdbId} · /embed/tv/{tmdbId}/{season}/{episode} */
const vidstuckUrl = (t: PlayTarget) => {
  const path = hasEpisode(t) ? `/embed/tv/${t.id}/${t.season ?? 1}/${t.episode ?? 1}` : `/embed/movie/${t.id}`;
  const params = new URLSearchParams({
    color: ACCENT,
    branding: 'PRIVA',
    overlay: 'true',
  });
  if (hasEpisode(t)) {
    params.set('nextEpisode', 'true');
    params.set('autoplayNextEpisode', 'true');
    params.set('episodeSelector', 'true');
  }
  return `${VIDSTUCK}${path}?${params.toString()}`;
};

export const SOURCES: StreamSource[] = [
  {
    id: 'priva',
    label: 'PRIVA Stream',
    note: 'Primary source. Picks the fastest server automatically.',
    param: 'first',
    build: (t) => privaUrl(t),
  },
  {
    id: 'cinemaos',
    label: 'Cinema Server',
    note: 'Alternate server on the PRIVA player.',
    param: 'cinemaos',
    build: (t) => privaUrl(t, 'cinemaos'),
  },
  {
    id: 'vidstuck',
    label: 'VidStuck',
    note: 'Backup player with subtitles, episode selector and a pause overlay.',
    param: 'vidstuck',
    build: vidstuckUrl,
  },
];

/** Legacy ids kept so old links and saved preferences still resolve. */
const ALIASES: Record<string, string> = {
  first: 'priva',
  second: 'vidstuck',
  vidsrc: 'vidstuck',
};

export function sourceById(id: string | null | undefined): StreamSource {
  const key = id ? ALIASES[id] ?? id : undefined;
  return SOURCES.find((s) => s.id === key) ?? SOURCES[0];
}
