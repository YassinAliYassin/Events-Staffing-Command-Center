// Firebase configuration for FPCC
// Get these from: https://console.firebase.google.com/project/_/settings/general

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "freshchat-3545e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "freshchat-3545e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "freshchat-3545e.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "0",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};