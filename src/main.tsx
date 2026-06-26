import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './styles/global.css';
import { syncFromFirestore } from './services/dataStore';

// Initialize Firestore sync on app load
syncFromFirestore().catch(err => console.warn('Initial Firestore sync failed:', err));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);