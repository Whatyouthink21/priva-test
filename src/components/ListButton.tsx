import { Check, Plus } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import type { Title } from '../lib/tmdb';

export function ListButton({ title, className = '' }: { title: Title; className?: string }) {
  const { isInList, toggleList } = useLibrary();
  const saved = isInList(title.type, title.id);
  return (
    <button
      className={`btn btn--ghost ${saved ? 'is-on' : ''} ${className}`}
      onClick={() =>
        toggleList({ type: title.type, tmdbId: title.id, title: title.title, poster: title.poster, backdrop: title.backdrop, year: title.year, rating: title.rating })
      }
      aria-pressed={saved}
    >
      {saved ? <Check size={16} /> : <Plus size={16} />}
      {saved ? 'In My List' : 'My List'}
    </button>
  );
}
