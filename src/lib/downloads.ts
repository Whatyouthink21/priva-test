import type { PlayTarget } from './players';

// Download sources. Both take TMDB ids and expose a page per title:
//   https://dl.vidsrc.party/movie/{tmdbId} · /tv/{tmdbId}/{season}/{episode}
//   https://vidvault.to/movie/{tmdbId}     · /tv/{tmdbId}/{season}/{episode}

export interface DownloadSource {
  id: string;
  label: string;
  note: string;
  build: (t: PlayTarget) => string;
}

export const DOWNLOAD_SOURCES: DownloadSource[] = [
  {
    id: 'vidsrc',
    label: 'VidSrc Downloads',
    note: 'Direct MKV links with quality and file size where available.',
    build: (t) =>
      t.type === 'tv'
        ? `https://dl.vidsrc.party/tv/${t.id}/${t.season ?? 1}/${t.episode ?? 1}`
        : `https://dl.vidsrc.party/movie/${t.id}`,
  },
  {
    id: 'vidvault',
    label: 'VidVault',
    note: 'Instant downloads plus 360p–1080p conversions.',
    build: (t) =>
      t.type === 'tv'
        ? `https://vidvault.to/tv/${t.id}/${t.season ?? 1}/${t.episode ?? 1}`
        : `https://vidvault.to/movie/${t.id}`,
  },
];

export function downloadUrl(id: string, target: PlayTarget): string {
  return (DOWNLOAD_SOURCES.find((s) => s.id === id) ?? DOWNLOAD_SOURCES[0]).build(target);
}
