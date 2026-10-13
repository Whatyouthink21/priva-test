import { AlertTriangle, Film, Loader2, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paths } from '../lib/routes';

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="state" role="status">
      <Loader2 className="spin" size={22} />
      <span>{label}…</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error?: Error; onRetry?: () => void }) {
  return (
    <div className="state state--error" role="alert">
      <AlertTriangle size={22} />
      <p>{error?.message ?? 'Something went wrong while loading this.'}</p>
      {onRetry && (
        <button className="btn btn--ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: { label: string; to: string } }) {
  return (
    <div className="state">
      <SearchX size={26} />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && (
        <Link className="btn btn--ghost" to={action.to}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function SetupNotice() {
  return (
    <div className="setup">
      <div className="setup__card">
        <Film size={28} />
        <p className="eyebrow">Setup needed</p>
        <h1>Add your TMDB key to start.</h1>
        <p>
          PRIVA reads its catalogue from The Movie Database. Create <code>.env.local</code> in the project root with:
        </p>
        <pre>VITE_TMDB_API_KEY=your_key_here</pre>
        <p>Then restart the dev server. Optional keys for accounts (Firebase) and IMDb ratings (OMDb) are listed in <code>.env.example</code>.</p>
        <Link to={paths.home()} className="btn btn--ghost">
          Reload
        </Link>
      </div>
    </div>
  );
}
