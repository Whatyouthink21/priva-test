import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

/** Fades and lifts its children into view the first time they enter the viewport. */
export function Reveal({ children, delay = 0, as = 'div', className = '' }: { children: ReactNode; delay?: number; as?: 'div' | 'section'; className?: string }) {
  const ref = useRef<HTMLDivElement & HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-in');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add('is-in');
            io.disconnect();
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as as 'div';
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={`reveal ${className}`} style={{ '--delay': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}
