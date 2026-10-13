import { Link } from 'react-router-dom';
import { useTitle } from '../hooks/useTitle';

export function NotFoundPage() {
  useTitle('Not found');
  return (
    <section className="notfound container">
      <p className="eyebrow">Error 404</p>
      <h1 className="display">This page is <em>off the schedule.</em></h1>
      <p className="muted">The link may be old, or the title may have moved.</p>
      <Link to="/" className="btn btn--primary">Back to home</Link>
    </section>
  );
}
