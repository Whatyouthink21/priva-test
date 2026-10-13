import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo />
          <p>Movies and television, catalogued with care. Stream, track what you watch, and pick up where you left off.</p>
        </div>
        <div>
          <h4>Browse</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/movies">Movies</Link></li>
            <li><Link to="/tv">TV Shows</Link></li>
            <li><Link to="/search">Search</Link></li>
          </ul>
        </div>
        <div>
          <h4>Account</h4>
          <ul>
            <li><Link to="/library">My List</Link></li>
            <li><Link to="/account">Sign in</Link></li>
          </ul>
        </div>
        <div className="footer__credit">
          <h4>Data</h4>
          <p>
            This product uses the TMDB API but is not endorsed or certified by TMDB. IMDb ratings are provided through OMDb where configured.
          </p>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} PRIVA</span>
        <span>Streams are provided by third-party players and are not hosted by PRIVA.</span>
      </div>
    </footer>
  );
}
