import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/global.css';
import './shell/shell.css';
import { syncFromFirestore } from './services/dataStore';

const startSync = () => {
  syncFromFirestore().catch(err => console.warn('Initial Firestore sync failed:', err));
};
if (typeof requestIdleCallback === 'function') requestIdleCallback(startSync, { timeout: 2500 });
else setTimeout(startSync, 400);

document.title = 'ESCC — Fresh People';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
