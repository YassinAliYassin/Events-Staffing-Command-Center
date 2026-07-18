// Firebase configuration for ESCC
// Prefer Vite env vars; fall back to the known applet project.

const isPlaceholder = (v: string | undefined) =>
  !v || v === 'your-api-key' || v === 'your-app-id' || v === '0';

// Fallback from firebase-applet-config.json (public web client keys)
const APPLET = {
  apiKey: 'AIzaSyA6P2A8euhnVmfo3EcR2TbgaMKqIFrBiXI',
  authDomain: 'intricate-karst-cs7sz.firebaseapp.com',
  projectId: 'intricate-karst-cs7sz',
  storageBucket: 'intricate-karst-cs7sz.firebasestorage.app',
  messagingSenderId: '586137501586',
  appId: '1:586137501586:web:11399424b12c75cdcd0b4b',
};

export const firebaseConfig = {
  apiKey: !isPlaceholder(import.meta.env.VITE_FIREBASE_API_KEY)
    ? import.meta.env.VITE_FIREBASE_API_KEY
    : APPLET.apiKey,
  authDomain: !isPlaceholder(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
    ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
    : APPLET.authDomain,
  projectId: !isPlaceholder(import.meta.env.VITE_FIREBASE_PROJECT_ID)
    ? import.meta.env.VITE_FIREBASE_PROJECT_ID
    : APPLET.projectId,
  storageBucket: !isPlaceholder(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)
    ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
    : APPLET.storageBucket,
  messagingSenderId: !isPlaceholder(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID)
    ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
    : APPLET.messagingSenderId,
  appId: !isPlaceholder(import.meta.env.VITE_FIREBASE_APP_ID)
    ? import.meta.env.VITE_FIREBASE_APP_ID
    : APPLET.appId,
};

/** True when we have a real-looking API key (not the sample placeholder). */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your-api-key' &&
  firebaseConfig.projectId &&
  firebaseConfig.appId &&
  firebaseConfig.appId !== 'your-app-id'
);
