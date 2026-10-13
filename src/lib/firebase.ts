import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || undefined,
};

/** True when a real web API key and app id are present. Without them the app runs in local-only mode. */
export const firebaseReady = Boolean(config.apiKey && config.projectId && config.appId);

export const app = firebaseReady ? initializeApp(config) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

if (app && config.measurementId) {
  isSupported()
    .then((ok) => ok && getAnalytics(app))
    .catch(() => undefined);
}
