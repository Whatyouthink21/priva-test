import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Layout() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);
  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <Navbar />
      <main id="main" key={pathname} className="page">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
