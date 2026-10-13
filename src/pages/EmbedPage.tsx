import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useTitle } from '../hooks/useTitle';
import { Reveal } from '../components/Reveal';
import { embedSnippet } from '../lib/players';
import { ACCENT } from '../config';

const PLAYER = 'https://tgvid.lovable.app';

export function EmbedPage() {
  useTitle('Embed the player');
  const [type, setType] = useState<'movie' | 'tv'>('movie');
  const [tmdbId, setTmdbId] = useState('1303331');
  const [season, setSeason] = useState('1');
  const [episode, setEpisode] = useState('1');
  const [color, setColor] = useState(`#${ACCENT}`);
  const [back, setBack] = useState(true);
  const [episodeSelector, setEpisodeSelector] = useState(true);
  const [autoplayNextEp, setAutoplayNextEp] = useState(true);
  const [server, setServer] = useState('');
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    const id = tmdbId.trim() || '0';
    const path = type === 'movie' ? `/embed/movie/${id}` : `/embed/tv/${id}/${season || 1}/${episode || 1}`;
    const p = new URLSearchParams();
    p.set('color', color.replace('#', ''));
    if (!back) p.set('back', 'false');
    if (type === 'tv' && !episodeSelector) p.set('episodeSelector', 'false');
    if (type === 'tv' && !autoplayNextEp) p.set('autoplayNextEp', 'false');
    if (server.trim()) p.set('server', server.trim());
    const query = p.toString();
    return `${PLAYER}${path}${query && query !== `color=${ACCENT}` ? `?${query}` : ''}`;
  }, [type, tmdbId, season, episode, color, back, episodeSelector, autoplayNextEp, server]);

  const snippet = embedSnippet(url);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <section className="page-head container">
        <Reveal>
          <p className="eyebrow">Developers</p>
          <h1 className="display">Embed the <em>player</em></h1>
          <p className="page-head__count">One iframe, any site. Build the link below and paste the snippet into your page.</p>
        </Reveal>
      </section>
      <div className="container embed">
        <div className="embed__form">
          <div className="segmented" role="tablist" aria-label="Title type">
            <button role="tab" aria-selected={type === 'movie'} className={type === 'movie' ? 'is-on' : ''} onClick={() => setType('movie')}>Movie</button>
            <button role="tab" aria-selected={type === 'tv'} className={type === 'tv' ? 'is-on' : ''} onClick={() => setType('tv')}>TV episode</button>
          </div>
          <label className="field"><span>TMDB ID</span><input inputMode="numeric" value={tmdbId} onChange={(e) => setTmdbId(e.target.value.replace(/\D/g, ''))} /></label>
          {type === 'tv' && (
            <div className="field-row">
              <label className="field"><span>Season</span><input inputMode="numeric" value={season} onChange={(e) => setSeason(e.target.value.replace(/\D/g, ''))} /></label>
              <label className="field"><span>Episode</span><input inputMode="numeric" value={episode} onChange={(e) => setEpisode(e.target.value.replace(/\D/g, ''))} /></label>
            </div>
          )}
          <label className="field">
            <span>Accent colour</span>
            <div className="color-field">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Pick accent colour" />
              <input value={color} onChange={(e) => setColor(e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`)} maxLength={7} />
            </div>
          </label>
          <div className="toggles">
            <Toggle label="Back button" value={back} onChange={setBack} />
            {type === 'tv' && <Toggle label="Episodes button" value={episodeSelector} onChange={setEpisodeSelector} />}
            {type === 'tv' && <Toggle label="Autoplay next episode" value={autoplayNextEp} onChange={setAutoplayNextEp} />}
          </div>
          <label className="field">
            <span>Server (optional)</span>
            <input value={server} onChange={(e) => setServer(e.target.value)} placeholder="e.g. cinemaos" />
          </label>
        </div>

        <div className="embed__out">
          <div className="embed__preview">
            <iframe key={url} src={url} title="Embed preview" width="100%" height="100%" frameBorder={0} allowFullScreen allow="autoplay; encrypted-media; fullscreen; picture-in-picture" />
          </div>
          <div className="code">
            <div className="code__bar">
              <span>URL</span>
            </div>
            <code className="code__line">{url}</code>
            <div className="code__bar">
              <span>iframe</span>
              <button className="icon-btn icon-btn--plain" onClick={copy} aria-label="Copy iframe code">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <pre className="code__block">{snippet}</pre>
          </div>
        </div>
      </div>
    </>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={value} className={`toggle ${value ? 'is-on' : ''}`} onClick={() => onChange(!value)}>
      <span className="toggle__knob" />
      {label}
    </button>
  );
}
