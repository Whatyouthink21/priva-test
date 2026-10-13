import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { db, firebaseReady } from '../lib/firebase';
import { useAuth } from './AuthContext';
import type { MediaType } from '../lib/tmdb';

/* ---------- types ---------- */

export interface LibraryItem {
  key: string;
  type: MediaType;
  tmdbId: number;
  title: string;
  poster: string | null;
  backdrop: string | null;
  year: string;
  rating: number;
  addedAt: number;
}

export interface WatchItem {
  key: string;
  type: MediaType;
  tmdbId: number;
  title: string;
  poster: string | null;
  backdrop: string | null;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  percent: number;
  position?: number;
  duration?: number;
  updatedAt: number;
}

export type ListInput = Omit<LibraryItem, 'key' | 'addedAt'>;
export type WatchInput = Omit<WatchItem, 'key' | 'updatedAt' | 'percent'> & { percent?: number; position?: number; duration?: number };

interface LibraryValue {
  list: LibraryItem[];
  history: WatchItem[];
  loaded: boolean;
  cloud: boolean;
  isInList: (type: MediaType, id: number) => boolean;
  toggleList: (item: ListInput) => Promise<void>;
  trackWatch: (item: WatchInput) => Promise<void>;
  removeWatch: (key: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const LibraryContext = createContext<LibraryValue | null>(null);

const LOCAL_KEY = 'priva:library:v1';
const keyOf = (type: MediaType, id: number) => `${type}-${id}`;

// Firestore rejects undefined values, so drop them before writing.
const clean = <T extends object>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

function readLocal(): { list: LibraryItem[]; history: WatchItem[] } {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { list: [], history: [] };
    const parsed = JSON.parse(raw);
    return { list: parsed.list ?? [], history: parsed.history ?? [] };
  } catch {
    return { list: [], history: [] };
  }
}

function writeLocal(list: LibraryItem[], history: WatchItem[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ list, history }));
  } catch {
    /* ignore quota errors */
  }
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const cloud = Boolean(uid && db && firebaseReady);

  const [list, setList] = useState<LibraryItem[]>([]);
  const [history, setHistory] = useState<WatchItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const migrated = useRef<string | null>(null);

  // Local mode: load from localStorage and keep in sync across tabs.
  useEffect(() => {
    if (cloud) return;
    const local = readLocal();
    setList(local.list);
    setHistory(local.history);
    setLoaded(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LOCAL_KEY) return;
      const next = readLocal();
      setList(next.list);
      setHistory(next.history);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [cloud]);

  // Cloud mode: one-time import of anything saved locally, then live subscriptions.
  useEffect(() => {
    if (!cloud || !db || !uid) return;
    const database = db;
    let unsubList = () => {};
    let unsubHistory = () => {};
    let cancelled = false;

    (async () => {
      if (migrated.current !== uid) {
        migrated.current = uid;
        const local = readLocal();
        if (local.list.length || local.history.length) {
          const batch = writeBatch(database);
          local.list.forEach((i) => batch.set(doc(database, 'users', uid, 'list', i.key), clean(i), { merge: true }));
          local.history.forEach((h) => batch.set(doc(database, 'users', uid, 'history', h.key), clean(h), { merge: true }));
          try {
            await batch.commit();
            writeLocal([], []);
          } catch {
            /* keep local copy if the import failed */
          }
        }
      }
      if (cancelled) return;
      unsubList = onSnapshot(
        query(collection(database, 'users', uid, 'list'), orderBy('addedAt', 'desc')),
        (snap) => {
          setList(snap.docs.map((d) => d.data() as LibraryItem));
          setLoaded(true);
        },
        () => setLoaded(true),
      );
      unsubHistory = onSnapshot(
        query(collection(database, 'users', uid, 'history'), orderBy('updatedAt', 'desc'), limit(40)),
        (snap) => setHistory(snap.docs.map((d) => d.data() as WatchItem)),
        () => undefined,
      );
    })();

    return () => {
      cancelled = true;
      unsubList();
      unsubHistory();
    };
  }, [cloud, uid]);

  const isInList = useCallback(
    (type: MediaType, id: number) => list.some((i) => i.key === keyOf(type, id)),
    [list],
  );

  const toggleList = useCallback(
    async (item: ListInput) => {
      const key = keyOf(item.type, item.tmdbId);
      const exists = list.some((i) => i.key === key);
      if (cloud && db && uid) {
        const ref = doc(db, 'users', uid, 'list', key);
        if (exists) await deleteDoc(ref);
        else await setDoc(ref, clean({ ...item, key, addedAt: Date.now() }));
        return;
      }
      const nextList = exists ? list.filter((i) => i.key !== key) : [{ ...item, key, addedAt: Date.now() }, ...list];
      setList(nextList);
      writeLocal(nextList, history);
    },
    [cloud, uid, list, history],
  );

  const trackWatch = useCallback(
    async (input: WatchInput) => {
      const key = keyOf(input.type, input.tmdbId);
      const prev = history.find((h) => h.key === key);
      const sameEpisode = prev?.season === input.season && prev?.episode === input.episode;
      const next: WatchItem = {
        ...input,
        key,
        percent: input.percent ?? (sameEpisode ? prev?.percent ?? 0 : 0),
        position: input.position ?? (sameEpisode ? prev?.position : undefined),
        duration: input.duration ?? (sameEpisode ? prev?.duration : undefined),
        updatedAt: Date.now(),
      };
      if (cloud && db && uid) {
        await setDoc(doc(db, 'users', uid, 'history', key), clean(next), { merge: true });
        return;
      }
      const nextHistory = [next, ...history.filter((h) => h.key !== key)].slice(0, 40);
      setHistory(nextHistory);
      writeLocal(list, nextHistory);
    },
    [cloud, uid, history, list],
  );

  const removeWatch = useCallback(
    async (key: string) => {
      if (cloud && db && uid) {
        await deleteDoc(doc(db, 'users', uid, 'history', key));
        return;
      }
      const nextHistory = history.filter((h) => h.key !== key);
      setHistory(nextHistory);
      writeLocal(list, nextHistory);
    },
    [cloud, uid, history, list],
  );

  const clearHistory = useCallback(async () => {
    if (cloud && db && uid) {
      const snap = await getDocs(collection(db, 'users', uid, 'history'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      return;
    }
    setHistory([]);
    writeLocal(list, []);
  }, [cloud, uid, list]);

  const value = useMemo<LibraryValue>(
    () => ({ list, history, loaded, cloud, isInList, toggleList, trackWatch, removeWatch, clearHistory }),
    [list, history, loaded, cloud, isInList, toggleList, trackWatch, removeWatch, clearHistory],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside LibraryProvider');
  return ctx;
}
