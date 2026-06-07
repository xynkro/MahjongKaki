import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// Self-hosted fonts (bundled + precached → fully offline, no Google CDN).
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import '@fontsource-variable/fraunces/wght.css';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Fade out the launch splash once the app has mounted.
const splash = document.getElementById('splash');
if (splash) {
  splash.style.pointerEvents = 'none';
  requestAnimationFrame(() => {
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 450);
  });
}
