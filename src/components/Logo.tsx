import { Link } from 'react-router-dom';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={`logo ${compact ? 'logo--compact' : ''}`} aria-label="PRIVA home">
      <span className="logo__mark" aria-hidden>
        <span />
      </span>
      <span className="logo__word">PRIVA</span>
    </Link>
  );
}
