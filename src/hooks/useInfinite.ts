import { useCallback, useEffect, useRef, useState } from 'react';
import type { Page } from '../lib/tmdb';

interface InfiniteState<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  error?: Error;
}

/** Paginated list that resets whenever `deps` change and supports "load more". */
export function useInfinite<T>(fetchPage: (page: number) => Promise<Page<T>>, deps: unknown[], enabled = true) {
  const [state, setState] = useState<InfiniteState<T>>({ items: [], page: 0, totalPages: 1, total: 0, loading: true });
  const gen = useRef(0);

  useEffect(() => {
    const id = ++gen.current;
    if (!enabled) {
      setState({ items: [], page: 0, totalPages: 1, total: 0, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: undefined }));
    fetchPage(1)
      .then((p) => {
        if (id !== gen.current) return;
        setState({ items: p.items, page: 1, totalPages: p.totalPages, total: p.totalResults, loading: false });
      })
      .catch((error: Error) => {
        if (id === gen.current) setState((s) => ({ ...s, loading: false, error }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  const latest = useRef(state);
  latest.current = state;

  const loadMore = useCallback(() => {
    const s = latest.current;
    if (s.loading || s.page >= s.totalPages) return;
    const id = gen.current;
    const next = s.page + 1;
    setState((cur) => ({ ...cur, loading: true }));
    fetchPage(next)
      .then((p) => {
        if (id !== gen.current) return;
        setState((cur) => ({ ...cur, items: [...cur.items, ...p.items], page: next, totalPages: p.totalPages, loading: false }));
      })
      .catch((error: Error) => {
        if (id === gen.current) setState((cur) => ({ ...cur, loading: false, error }));
      });
  }, [fetchPage]);

  return { ...state, hasMore: state.page < state.totalPages, loadMore };
}
