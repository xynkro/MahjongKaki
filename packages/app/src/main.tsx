import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// Self-hosted fonts (bundled + precached → fully offline, no Google CDN).
import '@fontsource-variable/inter/wght.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './styles/index.css';

// iPhone home-screen apps report a viewport shorter than the screen (WebKit bug
// 316008), leaving a dead band under the tab bar. Size the app from the screen.
if ((navigator as Navigator & { standalone?: boolean }).standalone && /iPhone/.test(navigator.userAgent)) {
  const setAppHeight = () => {
    const landscape = matchMedia('(orientation: landscape)').matches;
    document.documentElement.style.setProperty('--app-h', `${landscape ? screen.width : screen.height}px`);
  };
  setAppHeight();
  addEventListener('resize', setAppHeight);
}

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
