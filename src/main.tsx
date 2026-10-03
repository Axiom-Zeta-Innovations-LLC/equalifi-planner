import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure stale development service workers or cached assets are cleared immediately
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      if (import.meta.env.DEV || registration.active?.scriptURL.includes('dev-dist')) {
        registration.unregister().then(() => {
          console.log('[PWA] Stale dev service worker unregistered');
        });
      }
    }
  });

  if (import.meta.env.DEV && 'caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
