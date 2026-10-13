import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { paths } from '../lib/routes';

export function PersonCard({ id, name, sub, profile }: { id: number; name: string; sub?: string; profile: string | null }) {
  return (
    <Link to={paths.person(id, name)} className="person">
      <div className="person__photo">
        {profile ? <img src={profile} alt="" loading="lazy" /> : <User size={28} />}
      </div>
      <div className="person__name">{name}</div>
      {sub && <div className="person__sub">{sub}</div>}
    </Link>
  );
}
