# PRIVA

Movies and TV, with streaming, search, cast pages, IMDb ratings, My List and continue watching.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the keys you have
npm run dev                  # http://localhost:5173
npm run build                # production build in dist/
```

The TMDB key is already set in `.env` for this build. Put your own values in `.env.local` (git-ignored) to override.

## Configuration

| Variable | Needed for |
| --- | --- |
| `VITE_TMDB_API_KEY` | Catalogue, details, search (required) |
| `VITE_FIREBASE_*` | Sign-in and cloud sync of My List / history. Set `VITE_FIREBASE_API_KEY` (the web API key) and `VITE_FIREBASE_APP_ID` |
| `VITE_OMDB_API_KEY` | IMDb ratings. Free key from omdbapi.com. Without it the IMDb badge links to IMDb |

Without Firebase keys the app still works: My List and history are stored in the browser.

## Firebase setup

1. Enable Authentication → Google and Email/Password.
2. Create a Firestore database and publish `firestore.rules`.
3. Add the Firebase web app's config values to `.env.local`.

## Players

- **PRIVA Stream** (primary): `https://tgvid.lovable.app/embed/...` with `color`, `back=false`, `episodeSelector=false`, `autoplayNextEp=true`.
- **Cinema Server**: same player with `server=cinemaos`.
- **VidStuck**: `https://vidstuck.xyz/embed/movie/{tmdbId}` and `/embed/tv/{tmdbId}/{season}/{episode}` with `color`, `branding=PRIVA`, `overlay=true` (TV adds `nextEpisode`, `autoplayNextEpisode` and `episodeSelector`). It posts playback progress back to the page, which the watch page records as history.

All player URLs are built in `src/lib/players.ts`; the old `server=second`/`vidsrc` links still resolve to VidStuck.

## Downloads

`src/lib/downloads.ts` builds a per-title page on each download source. Both take TMDB ids:

- **VidSrc Downloads** — `https://dl.vidsrc.party/movie/{tmdbId}`, `/tv/{tmdbId}/{season}/{episode}`
- **VidVault** — `https://vidvault.to/movie/{tmdbId}`, `/tv/{tmdbId}/{season}/{episode}`

Links appear in a *Save a copy* section on film and series pages and next to the player on the watch page. Nothing is proxied or hosted by PRIVA.

## Where to watch

Film and series pages list the streaming providers that carry the title (Netflix, Prime Video, Disney+ and so on) using the TMDB watch-provider API, grouped into subscription, free, rent and buy, with a country picker. Provider availability is JustWatch data, surfaced through TMDB.

## Trailers

The hero carousel and the film/series pages play the title's trailer muted and looping behind the artwork (`BackdropVideo`). Trailers are skipped when the visitor prefers reduced motion, and the still image stays in place as a fallback.

Routes use hash URLs (`#/movie/603-title`, `#/tv/94605`, `#/person/…`, `#/watch/tv/94605/1/1?server=cinemaos`, `#/search?q=…`, `#/genre/movie/28`).

This product uses the TMDB API but is not endorsed or certified by TMDB.
