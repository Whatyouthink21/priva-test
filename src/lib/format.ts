export const year = (d?: string | null) => (d ? d.slice(0, 4) : '');

export function runtime(min?: number | null): string {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function money(n?: number): string {
  if (!n) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: n >= 1_000_000 ? 'compact' : 'standard',
    maximumFractionDigits: n >= 1_000_000 ? 1 : 0,
  }).format(n);
}

export function longDate(d?: string | null): string {
  if (!d) return '—';
  const date = new Date(`${d}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function score(n?: number | null): string {
  return n ? n.toFixed(1) : '—';
}

export function compact(n?: number | null): string {
  if (!n) return '0';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function parseId(param: string | undefined): number {
  return parseInt(param ?? '', 10) || 0;
}

export function plural(n: number, word: string): string {
  return `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
