import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LibraryProvider } from './context/LibraryContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { SearchPage } from './pages/SearchPage';
import { DetailsPage, CastPage } from './pages/DetailsPage';
import { PersonPage } from './pages/PersonPage';
import { WatchPage } from './pages/WatchPage';
import { LibraryPage } from './pages/LibraryPage';
import { AccountPage } from './pages/AccountPage';
import { EmbedPage } from './pages/EmbedPage';
import { NotFoundPage } from './pages/NotFoundPage';

/** Old genre URLs redirect to the catalogue with the genre filter applied. */
function GenreRedirect() {
  const { type = 'movie', id = '' } = useParams();
  return <Navigate to={`/${type === 'tv' ? 'tv' : 'movies'}?genre=${encodeURIComponent(id)}`} replace />;
}

export function App() {
  return (
    <AuthProvider>
      <LibraryProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="movies" element={<CatalogPage type="movie" />} />
              <Route path="tv" element={<CatalogPage type="tv" />} />
              <Route path="genre/:type/:id" element={<GenreRedirect />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="movie/:id" element={<DetailsPage type="movie" />} />
              <Route path="tv/:id" element={<DetailsPage type="tv" />} />
              <Route path="movie/:id/cast" element={<CastPage type="movie" />} />
              <Route path="tv/:id/cast" element={<CastPage type="tv" />} />
              <Route path="person/:id" element={<PersonPage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="embed" element={<EmbedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="watch/movie/:id" element={<WatchPage type="movie" />} />
            <Route path="watch/tv/:id/:season/:episode" element={<WatchPage type="tv" />} />
          </Routes>
        </HashRouter>
      </LibraryProvider>
    </AuthProvider>
  );
}
