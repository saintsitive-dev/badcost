import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// Force reload when a new service worker takes control (eliminates stale cache blank page)
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/badcost">
      <App />
    </BrowserRouter>
  </StrictMode>,
);
