import type { MediaType, Title } from './tmdb';

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

export const paths = {
  home: () => '/',
  browse: (type: MediaType) => (type === 'movie' ? '/movies' : '/tv'),
  genre: (type: MediaType, id: number, name?: string) => `/genre/${type}/${id}${name ? `?name=${encodeURIComponent(name)}` : ''}`,
  search: (q = '', type = 'all', genre?: number) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (type !== 'all') p.set('type', type);
    if (genre) p.set('genre', String(genre));
    const s = p.toString();
    return `/search${s ? `?${s}` : ''}`;
  },
  details: (type: MediaType, id: number, name = '') => `/${type}/${id}${name ? `-${slug(name)}` : ''}`,
  cast: (type: MediaType, id: number) => `/${type}/${id}/cast`,
  person: (id: number, name = '') => `/person/${id}${name ? `-${slug(name)}` : ''}`,
  watch: (type: MediaType, id: number, season = 1, episode = 1) =>
    type === 'movie' ? `/watch/movie/${id}` : `/watch/tv/${id}/${season}/${episode}`,
  library: () => '/library',
  account: () => '/account',
  embed: () => '/embed',
};

export const detailsOf = (t: Title) => paths.details(t.type, t.id, t.title);
export const watchOf = (t: Title) => paths.watch(t.type, t.id);
