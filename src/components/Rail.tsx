import { useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from './Reveal';

interface RailProps {
  eyebrow?: string;
  title: string;
  seeAll?: { label?: string; to: string };
  children: ReactNode;
  id?: string;
  tools?: ReactNode;
}

/** Horizontal, arrow-navigable row of content. */
export function Rail({ eyebrow, title, seeAll, children, id, tools }: RailProps) {
  const track = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };
  return (
    <Reveal as="section" className="rail" >
      <header className="section-head">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 id={id}>{title}</h2>
        </div>
        <div className="section-head__actions">
          {tools}
          {seeAll && (
            <Link to={seeAll.to} className="link-arrow">
              {seeAll.label ?? 'See all'}
            </Link>
          )}
          <div className="arrows">
            <button aria-label="Scroll left" onClick={() => scrollBy(-1)}>
              <ChevronLeft size={18} />
            </button>
            <button aria-label="Scroll right" onClick={() => scrollBy(1)}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </header>
      <div className="rail__track" ref={track}>
        {children}
      </div>
    </Reveal>
  );
}
