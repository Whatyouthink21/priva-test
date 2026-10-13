import { useEffect } from 'react';

export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · PRIVA` : 'PRIVA · Movies & TV';
  }, [title]);
}
