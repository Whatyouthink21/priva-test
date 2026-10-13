// Central configuration. All values come from Vite env vars (see .env / .env.example).

export const TMDB_KEY: string = import.meta.env.VITE_TMDB_API_KEY ?? '';
export const OMDB_KEY: string = import.meta.env.VITE_OMDB_API_KEY ?? '';

// Accent colour used by PRIVA and passed to the player (hex, no #).
export const ACCENT = 'ff4d1f';

export const SITE = {
  name: 'PRIVA',
  tagline: 'Movies and television, without the noise.',
};
