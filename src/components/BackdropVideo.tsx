import { useEffect, useState } from 'react';

const YT = 'https://www.youtube-nocookie.com/embed';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Muted, looping trailer used as a page backdrop (hero, film and series pages).
 * The poster image behind it stays visible until the player has loaded, and the
 * iframe never takes pointer events so it can sit under other content.
 */
export function BackdropVideo({
  videoKey,
  delay = 1200,
  start = 0,
  className = '',
}: {
  videoKey: string;
  /** Wait this long before mounting the player, so the still image reads first. */
  delay?: number;
  /** Start the trailer at this many seconds (skips studio cards). */
  start?: number;
  className?: string;
}) {
  const [reduced] = useState(prefersReducedMotion);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMounted(false);
    setReady(false);
    if (reduced) return;
    const t = window.setTimeout(() => setMounted(true), delay);
    return () => window.clearTimeout(t);
  }, [videoKey, delay, reduced]);

  if (reduced || !mounted) return null;

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    loop: '1',
    playlist: videoKey,
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    disablekb: '1',
    fs: '0',
  });
  if (start > 0) params.set('start', String(start));

  return (
    <div className={`bg-video ${ready ? 'is-ready' : ''} ${className}`} aria-hidden="true">
      <iframe
        key={videoKey}
        src={`${YT}/${videoKey}?${params.toString()}`}
        title=""
        tabIndex={-1}
        allow="autoplay; encrypted-media"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => window.setTimeout(() => setReady(true), 400)}
      />
    </div>
  );
}
