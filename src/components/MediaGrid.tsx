import type { ReactNode } from 'react';
import { PosterCard, PosterSkeleton } from './PosterCard';
import type { Title } from '../lib/tmdb';

export function MediaGrid({ items, loading, ranked }: { items: Title[]; loading?: boolean; ranked?: boolean }) {
  return (
    <div className="grid">
      {items.map((t, i) => (
        <PosterCard key={t.key} title={t} index={i % 12} rank={ranked ? i + 1 : undefined} />
      ))}
      {loading && <PosterSkeleton count={items.length ? 6 : 18} />}
    </div>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <div className="chips" role="list">{children}</div>;
}
