import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Trash2, X } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { useAuth } from '../context/AuthContext';
import { useTitle } from '../hooks/useTitle';
import { PosterCard, libraryToTitle } from '../components/PosterCard';
import { Empty } from '../components/States';
import { Reveal } from '../components/Reveal';
import { paths } from '../lib/routes';

type Tab = 'list' | 'history';

export function LibraryPage() {
  useTitle('My List');
  const { list, history, loaded, cloud, removeWatch, clearHistory } = useLibrary();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('list');

  return (
    <>
      <section className="page-head container">
        <Reveal>
          <p className="eyebrow">Your library</p>
          <h1 className="display">My <em>List</em></h1>
          <p className="page-head__count">
            {cloud ? `Synced to ${user?.email ?? 'your account'}` : 'Saved on this device.'}{' '}
            {!cloud && (
              <Link to={paths.account()} className="link-arrow">Sign in to sync across devices</Link>
            )}
          </p>
        </Reveal>
      </section>
      <div className="container">
        <div className="segmented" role="tablist" aria-label="Library sections">
          <button role="tab" aria-selected={tab === 'list'} className={tab === 'list' ? 'is-on' : ''} onClick={() => setTab('list')}>
            My List · {list.length}
          </button>
          <button role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'is-on' : ''} onClick={() => setTab('history')}>
            Continue watching · {history.length}
          </button>
        </div>

        {!loaded ? (
          <p className="muted section">Loading your library…</p>
        ) : tab === 'list' ? (
          list.length === 0 ? (
            <Empty title="Your list is empty" text="Tap + on any title to save it here for later." action={{ label: 'Browse films', to: '/movies' }} />
          ) : (
            <div className="grid section">
              {list.map((i, n) => (
                <PosterCard key={i.key} title={libraryToTitle(i)} index={n % 12} />
              ))}
            </div>
          )
        ) : history.length === 0 ? (
          <Empty title="Nothing in progress" text="Start something and it will appear here, ready to resume." action={{ label: 'Find something', to: '/' }} />
        ) : (
          <>
            <div className="history-tools">
              <button className="btn btn--ghost" onClick={() => clearHistory()}>
                <Trash2 size={15} /> Clear history
              </button>
            </div>
            <div className="history-list section">
              {history.map((h) => (
                <article key={h.key} className="history-row">
                  <Link to={h.type === 'movie' ? paths.watch('movie', h.tmdbId) : paths.watch('tv', h.tmdbId, h.season, h.episode)} className="history-row__still">
                    {h.backdrop ? <img src={h.backdrop} alt="" loading="lazy" /> : null}
                    <span className="poster__shade" />
                    <span className="continue__play"><Play size={16} fill="currentColor" /></span>
                    <span className="progress"><span style={{ width: `${Math.max(3, h.percent)}%` }} /></span>
                  </Link>
                  <div className="history-row__body">
                    <Link to={paths.details(h.type, h.tmdbId, h.title)} className="history-row__title">{h.title}</Link>
                    <small>
                      {h.type === 'tv' && h.season ? `Season ${h.season} · Episode ${h.episode}${h.episodeTitle ? ` · ${h.episodeTitle}` : ''}` : h.type === 'movie' ? 'Film' : 'Series'}
                    </small>
                    <small className="muted">
                      {h.percent > 0 ? `${Math.round(h.percent)}% watched · ` : ''}
                      {new Date(h.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </small>
                  </div>
                  <button className="icon-btn icon-btn--plain" aria-label={`Remove ${h.title} from history`} onClick={() => removeWatch(h.key)}>
                    <X size={16} />
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
