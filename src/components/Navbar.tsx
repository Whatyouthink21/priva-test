import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, Menu, Search, User, X } from 'lucide-react';
import { Logo } from './Logo';
import { paths } from '../lib/routes';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/movies', label: 'Movies' },
  { to: '/tv', label: 'TV Shows' },
  { to: '/embed', label: 'Embed' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <div className="nav__inner">
        <Logo />
        <nav className="nav__links" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav__link">
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav__tools">
          <button className="icon-btn icon-btn--plain" aria-label="Search" onClick={() => navigate(paths.search())}>
            <Search size={19} />
          </button>
          <NavLink to={paths.library()} className="icon-btn icon-btn--plain" aria-label="My List and history" title="My List">
            <Bookmark size={18} />
          </NavLink>
          <NavLink to={paths.account()} className="icon-btn icon-btn--plain account-btn" aria-label="Account" title={user ? user.displayName || user.email || 'Account' : 'Sign in'}>
            {user?.photoURL ? <img src={user.photoURL} alt="" /> : <User size={18} />}
            {user && <span className="account-dot" />}
          </NavLink>
          <button className="icon-btn icon-btn--plain nav__menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <nav className="nav__sheet" aria-label="Mobile">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className="nav__sheet-link">
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
