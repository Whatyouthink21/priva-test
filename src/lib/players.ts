import { ACCENT } from '../config';
import type { MediaType } from './tmdb';

// Player sources. The primary PRIVA player is the tgvid embed documented in the brief.
// The second source is configured below; change `build` if your second provider uses another URL.

const PRIVA_PLAYER = 'https://tgvid.lovable.app';

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
  /** Value of the `server` query parameter understood by the PRIVA player, if any. */
  server?: string;
  build: (t: PlayTarget) => string;
}

const privaUrl = (t: PlayTarget, server?: string) => {
  const path = t.type === 'movie' ? `/embed/movie/${t.id}` : `/embed/tv/${t.id}/${t.season ?? 1}/${t.episode ?? 1}`;
  const params = new URLSearchParams({
    color: ACCENT,
    back: 'false',
    episodeSelector: 'false',
    autoplayNextEp: 'true',
  });
  if (server) params.set('server', server);
  return `${PRIVA_PLAYER}${path}?${params.toString()}`;
};

export const SOURCES: StreamSource[] = [
  {
    id: 'priva',
    label: 'PRIVA Stream',
    note: 'Primary source. Picks the fastest server automatically.',
    build: (t) => privaUrl(t),
  },
  {
    id: 'cinemaos',
    label: 'Cinema Server',
    note: 'Alternate server on the PRIVA player.',
    server: 'cinemaos',
    build: (t) => privaUrl(t, 'cinemaos'),
  },
  {
    id: 'second',
    label: 'Second source',
    note: 'Backup provider. Use it if the primary stalls.',
    build: (t) =>
      t.type === 'movie'
        ? `https://vidsrc.mov/embed/movie/${t.id}`
        : `https://vidsrc.mov/embed/tv/${t.id}/${t.season ?? 1}/${t.episode ?? 1}`,
  },
];

export function sourceById(id: string | null | undefined): StreamSource {
  const key = id === 'first' ? 'priva' : id;
  return SOURCES.find((s) => s.id === key) ?? SOURCES[0];
}

/** Iframe snippet for embedding the PRIVA player on another site. */
export function embedSnippet(url: string) {
  return `<iframe\n  src="${url}"\n  width="100%" height="100%" frameborder="0"\n  allowfullscreen allow="autoplay; encrypted-media; fullscreen; picture-in-picture">\n</iframe>`;
}
