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
  // setTimeout (not rAF) so the splash always clears even if the tab is
  // backgrounded/throttled during load (rAF is paused in background tabs).
  setTimeout(() => {
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 450);
  }, 80);
}
