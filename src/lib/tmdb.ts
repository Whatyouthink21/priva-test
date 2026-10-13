import { TMDB_KEY } from '../config';

const API = 'https://api.themoviedb.org/3';
export const IMG = 'https://image.tmdb.org/t/p';

export type MediaType = 'movie' | 'tv';

export class TmdbError extends Error {}

type Params = Record<string, string | number | boolean | undefined | null>;

const cache = new Map<string, Promise<unknown>>();

function request<T>(path: string, params: Params = {}): Promise<T> {
  if (!TMDB_KEY) return Promise.reject(new TmdbError('TMDB API key is not configured.'));
  const url = new URL(API + path);
  url.searchParams.set('api_key', TMDB_KEY);
  url.searchParams.set('language', 'en-US');
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const href = url.toString();
  const hit = cache.get(href);
  if (hit) return hit as Promise<T>;
  const p = fetch(href).then(async (res) => {
    if (!res.ok) throw new TmdbError(`TMDB request failed (${res.status}).`);
    return (await res.json()) as T;
  });
  cache.set(href, p);
  p.catch(() => cache.delete(href));
  return p;
}

export function img(path: string | null | undefined, size: string): string | null {
  return path ? `${IMG}/${size}${path}` : null;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Title {
  key: string;
  id: number;
  type: MediaType;
  title: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  votes: number;
  date: string;
  year: string;
  genreIds: number[];
  popularity: number;
  language: string;
}

export interface Page<T> {
  page: number;
  totalPages: number;
  totalResults: number;
  items: T[];
}

export interface Person {
  id: number;
  name: string;
  character?: string;
  job?: string;
  department?: string;
  profile: string | null;
  episodes?: number;
}

export interface SeasonInfo {
  id: number;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string;
  poster: string | null;
}

export interface Episode {
  id: number;
  number: number;
  season: number;
  name: string;
  overview: string;
  still: string | null;
  airDate: string;
  runtime: number | null;
  rating: number;
}

export interface Details extends Title {
  tagline: string;
  runtime: number;
  status: string;
  genres: Genre[];
  imdbId: string | null;
  homepage: string;
  certification: string;
  seasons: SeasonInfo[];
  numberOfEpisodes: number;
  networks: { id: number; name: string; logo: string | null }[];
  creators: Person[];
  cast: Person[];
  crew: Person[];
  trailer: string | null;
  similar: Title[];
  recommendations: Title[];
  budget: number;
  revenue: number;
  spokenLanguages: string[];
  countries: string[];
}

export interface FilmItem {
  title: Title;
  role: string;
  acting: boolean;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string;
  deathday: string;
  placeOfBirth: string;
  department: string;
  profile: string | null;
  imdbId: string | null;
  homepage: string;
  films: FilmItem[];
}

export interface SearchPerson {
  id: number;
  name: string;
  department: string;
  profile: string | null;
  knownFor: string[];
}

/* ---------- normalisation ---------- */

interface RawItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: Genre[];
  popularity?: number;
  original_language?: string;
  media_type?: string;
}

export function toTitle(raw: RawItem, fallback: MediaType = 'movie'): Title {
  const type: MediaType = raw.media_type === 'tv' || raw.media_type === 'movie' ? raw.media_type : fallback;
  const date = (type === 'movie' ? raw.release_date : raw.first_air_date) ?? '';
  return {
    key: `${type}-${raw.id}`,
    id: raw.id,
    type,
    title: raw.title ?? raw.name ?? 'Untitled',
    overview: raw.overview ?? '',
    poster: img(raw.poster_path, 'w500'),
    backdrop: img(raw.backdrop_path, 'w1280'),
    rating: raw.vote_average ?? 0,
    votes: raw.vote_count ?? 0,
    date,
    year: date.slice(0, 4),
    genreIds: raw.genre_ids ?? raw.genres?.map((g) => g.id) ?? [],
    popularity: raw.popularity ?? 0,
    language: raw.original_language ?? '',
  };
}

interface RawPage {
  page: number;
  total_pages: number;
  total_results: number;
  results: RawItem[];
}

function toPage(raw: RawPage, type: MediaType): Page<Title> {
  return {
    page: raw.page,
    totalPages: raw.total_pages,
    totalResults: raw.total_results,
    items: raw.results.filter((r) => r.media_type !== 'person').map((r) => toTitle(r, type)),
  };
}

/* ---------- lists ---------- */

export type ListName = 'popular' | 'top_rated' | 'upcoming' | 'now_playing' | 'on_the_air' | 'airing_today';

export function getList(type: MediaType, list: ListName, page = 1) {
  return request<RawPage>(`/${type}/${list}`, { page }).then((r) => toPage(r, type));
}

export function getTrending(type: 'all' | MediaType, window: 'day' | 'week', page = 1) {
  return request<RawPage>(`/trending/${type}/${window}`, { page }).then((r) =>
    toPage(r, type === 'tv' ? 'tv' : 'movie'),
  );
}

export interface DiscoverOpts {
  genre?: number;
  sort?: string;
  year?: string;
  minVotes?: number;
  page?: number;
}

export function discover(type: MediaType, o: DiscoverOpts) {
  return request<RawPage>(`/discover/${type}`, {
    with_genres: o.genre,
    sort_by: o.sort ?? 'popularity.desc',
    [type === 'movie' ? 'primary_release_year' : 'first_air_date_year']: o.year,
    'vote_count.gte': o.minVotes,
    include_adult: false,
    page: o.page ?? 1,
  }).then((r) => toPage(r, type));
}

export function getGenres(type: MediaType) {
  return request<{ genres: Genre[] }>(`/genre/${type}/list`).then((r) => r.genres);
}

/* ---------- search ---------- */

export function searchMulti(query: string, page = 1) {
  return request<RawPage>('/search/multi', { query, page, include_adult: false }).then((raw) => ({
    page: raw.page,
    totalPages: raw.total_pages,
    totalResults: raw.total_results,
    items: raw.results.filter((r) => r.media_type === 'movie' || r.media_type === 'tv').map((r) => toTitle(r)),
  }));
}

export function searchPerson(query: string, page = 1): Promise<Page<SearchPerson>> {
  return request<RawPage & { results: any[] }>('/search/person', { query, page, include_adult: false }).then((raw) => ({
    page: raw.page,
    totalPages: raw.total_pages,
    totalResults: raw.total_results,
    items: raw.results.map((p: any) => ({
      id: p.id,
      name: p.name ?? '',
      department: p.known_for_department ?? '',
      profile: img(p.profile_path ?? null, 'w185'),
      knownFor: (p.known_for ?? []).map((k: any) => k.title ?? k.name ?? '').filter(Boolean),
    })),
  }));
}

export function searchType(type: MediaType, query: string, page = 1) {
  return request<RawPage>(`/search/${type}`, { query, page, include_adult: false }).then((r) => toPage(r, type));
}

/* ---------- details ---------- */

interface RawCast {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  roles?: { character: string; episode_count: number }[];
  total_episode_count?: number;
  department?: string;
  job?: string;
  jobs?: { job: string }[];
}

interface RawVideo {
  key: string;
  site: string;
  type: string;
  name?: string;
  official?: boolean;
}

function mapPerson(c: RawCast, isCrew: boolean): Person {
  return {
    id: c.id,
    name: c.name,
    character: isCrew ? undefined : c.character ?? c.roles?.[0]?.character ?? '',
    job: isCrew ? c.job ?? c.jobs?.[0]?.job ?? '' : undefined,
    department: c.department ?? '',
    profile: img(c.profile_path, 'w185'),
    episodes: c.total_episode_count,
  };
}

function bestTrailer(videos: RawVideo[] | undefined): RawVideo | null {
  const yt = (videos ?? []).filter((v) => v.site === 'YouTube');
  return (
    yt.find((v) => v.type === 'Trailer' && v.official) ??
    yt.find((v) => v.type === 'Trailer') ??
    yt.find((v) => v.type === 'Teaser') ??
    yt[0] ??
    null
  );
}

function pickTrailer(videos: RawVideo[] | undefined): string | null {
  return bestTrailer(videos)?.key ?? null;
}

const CREW_ORDER = ['Director', 'Screenplay', 'Writer', 'Story', 'Creator', 'Executive Producer', 'Producer', 'Director of Photography', 'Original Music Composer', 'Editor'];

export function getDetails(type: MediaType, id: number): Promise<Details> {
  const append =
    type === 'movie'
      ? 'credits,videos,external_ids,recommendations,similar,release_dates'
      : 'aggregate_credits,videos,external_ids,recommendations,similar,content_ratings';
  return request<Record<string, any>>(`/${type}/${id}`, { append_to_response: append }).then((r) => {
    const base = toTitle({ ...r, media_type: type } as RawItem, type);
    const isMovie = type === 'movie';
    const castRaw: RawCast[] = isMovie ? r.credits?.cast ?? [] : r.aggregate_credits?.cast ?? [];
    const crewRaw: RawCast[] = isMovie ? r.credits?.crew ?? [] : r.aggregate_credits?.crew ?? [];
    const crew = crewRaw
      .map((c) => mapPerson(c, true))
      .sort((a, b) => CREW_ORDER.indexOf(a.job ?? '') - CREW_ORDER.indexOf(b.job ?? '') || 0);
    const certification = isMovie
      ? (r.release_dates?.results ?? []).find((x: any) => x.iso_3166_1 === 'US')?.release_dates?.find((d: any) => d.certification)?.certification ?? ''
      : (r.content_ratings?.results ?? []).find((x: any) => x.iso_3166_1 === 'US')?.rating ?? '';
    return {
      ...base,
      tagline: r.tagline ?? '',
      runtime: isMovie ? r.runtime ?? 0 : r.episode_run_time?.[0] ?? 0,
      status: r.status ?? '',
      genres: r.genres ?? [],
      imdbId: r.external_ids?.imdb_id ?? r.imdb_id ?? null,
      homepage: r.homepage ?? '',
      certification,
      seasons: (r.seasons ?? [])
        .filter((s: any) => s.season_number > 0)
        .map((s: any) => ({
          id: s.id,
          seasonNumber: s.season_number,
          name: s.name,
          episodeCount: s.episode_count,
          airDate: s.air_date ?? '',
          poster: img(s.poster_path, 'w342'),
        })),
      numberOfEpisodes: r.number_of_episodes ?? 0,
      networks: (r.networks ?? []).map((n: any) => ({ id: n.id, name: n.name, logo: img(n.logo_path, 'w185') })),
      creators: (r.created_by ?? []).map((c: RawCast) => mapPerson(c, false)),
      cast: castRaw.map((c) => mapPerson(c, false)),
      crew,
      trailer: pickTrailer(r.videos?.results),
      similar: (r.similar?.results ?? []).map((x: RawItem) => toTitle(x, type)),
      recommendations: (r.recommendations?.results ?? []).map((x: RawItem) => toTitle(x, type)),
      budget: r.budget ?? 0,
      revenue: r.revenue ?? 0,
      spokenLanguages: (r.spoken_languages ?? []).map((l: any) => l.english_name ?? l.name),
      countries: (r.production_countries ?? r.origin_country ?? []).map((c: any) => (typeof c === 'string' ? c : c.name)),
    } as Details;
  });
}

export interface Trailer {
  key: string;
  name: string;
}

/** Lightweight trailer lookup used for background playback (hero + details pages). */
export function getTrailer(type: MediaType, id: number): Promise<Trailer | null> {
  return request<{ results?: RawVideo[] }>(`/${type}/${id}/videos`).then((r) => {
    const best = bestTrailer(r.results);
    return best ? { key: best.key, name: best.name ?? 'Trailer' } : null;
  });
}

/* ---------- watch providers (where to stream) ---------- */

export interface WatchProvider {
  id: number;
  name: string;
  logo: string | null;
}

export interface ProviderRegion {
  /** JustWatch page for this title in the region. */
  link: string;
  flatrate: WatchProvider[];
  free: WatchProvider[];
  ads: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

function providerList(raw: unknown): WatchProvider[] {
  return ((raw as any[]) ?? []).map((p) => ({
    id: p.provider_id,
    name: p.provider_name ?? '',
    logo: img(p.logo_path, 'w92'),
  }));
}

/**
 * Streaming availability per country, keyed by ISO-3166-1 code (US, GB, IN…).
 * Returns an empty object when TMDB has no data for the title.
 */
export function getWatchProviders(type: MediaType, id: number): Promise<Record<string, ProviderRegion>> {
  return request<{ results?: Record<string, any> }>(`/${type}/${id}/watch/providers`).then((r) => {
    const out: Record<string, ProviderRegion> = {};
    for (const [code, v] of Object.entries(r.results ?? {})) {
      out[code] = {
        link: v?.link ?? '',
        flatrate: providerList(v?.flatrate),
        free: providerList(v?.free),
        ads: providerList(v?.ads),
        rent: providerList(v?.rent),
        buy: providerList(v?.buy),
      };
    }
    return out;
  });
}

export interface ProviderRegionOption {
  code: string;
  name: string;
}

/** Countries TMDB reports provider data for, alphabetical by English name. */
export function getProviderRegions(): Promise<ProviderRegionOption[]> {
  return request<{ results?: { iso_3166_1: string; english_name: string; native_name: string }[] }>(
    '/watch/providers/regions',
  ).then((r) =>
    (r.results ?? [])
      .map((x) => ({ code: x.iso_3166_1, name: x.english_name || x.native_name || x.iso_3166_1 }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
}

export function getSeason(tvId: number, season: number): Promise<Episode[]> {
  return request<{ episodes: any[] }>(`/tv/${tvId}/season/${season}`).then((r) =>
    r.episodes.map((e) => ({
      id: e.id,
      number: e.episode_number,
      season: e.season_number,
      name: e.name,
      overview: e.overview ?? '',
      still: img(e.still_path, 'w500'),
      airDate: e.air_date ?? '',
      runtime: e.runtime ?? null,
      rating: e.vote_average ?? 0,
    })),
  );
}

export function getPerson(id: number): Promise<PersonDetails> {
  return request<Record<string, any>>(`/person/${id}`, { append_to_response: 'combined_credits,external_ids' }).then((r) => {
    const credits = r.combined_credits ?? { cast: [], crew: [] };
    const films = new Map<string, FilmItem>();
    const add = (c: RawItem & { character?: string; job?: string }, acting: boolean) => {
      if (!c.id || (c.media_type !== 'movie' && c.media_type !== 'tv')) return;
      const title = toTitle(c as RawItem, c.media_type as MediaType);
      if (!title.poster && !title.title) return;
      const existing = films.get(title.key);
      const role = acting ? c.character ?? '' : c.job ?? '';
      if (existing) {
        if (acting && !existing.acting) existing.acting = true;
        if (role && !existing.role.includes(role)) existing.role = existing.role ? `${existing.role} · ${role}` : role;
      } else {
        films.set(title.key, { title, role, acting });
      }
    };
    credits.cast.forEach((c: any) => add(c, true));
    credits.crew.forEach((c: any) => add(c, false));
    const list = [...films.values()].sort((a, b) => (b.title.date || '').localeCompare(a.title.date || ''));
    return {
      id: r.id,
      name: r.name,
      biography: r.biography ?? '',
      birthday: r.birthday ?? '',
      deathday: r.deathday ?? '',
      placeOfBirth: r.place_of_birth ?? '',
      department: r.known_for_department ?? '',
      profile: img(r.profile_path, 'h632'),
      imdbId: r.imdb_id ?? r.external_ids?.imdb_id ?? null,
      homepage: r.homepage ?? '',
      films: list,
    };
  });
}
