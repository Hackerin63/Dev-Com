import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Each variable must be referenced literally so Expo can inline it at build time.
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** False until real values are supplied in .env (placeholders from .env.example do not count). */
export const isFirebaseConfigured = Object.values(config).every(
  (value) => typeof value === 'string' && value.length > 0 && !value.startsWith('your-'),
);

const app = getApps().length
  ? getApp()
  : initializeApp(
      isFirebaseConfigured
        ? config
        : // Harmless placeholders so the app can still show the "setup required" screen.
          { apiKey: 'not-configured', projectId: 'not-configured', appId: 'not-configured' },
    );

function createAuth() {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Already initialised (for example after a fast refresh).
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
export const storage = getStorage(app);
