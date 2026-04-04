import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[CondoPlus] Service Worker registrado:', registration.scope);

        // Check for updates every time the page loads
        registration.update();

        // Notify user when a new version is available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available — send SKIP_WAITING to activate immediately
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                // Reload to load the new version
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[CondoPlus] Service Worker falhou ao registrar:', error);
      });
  });
}
