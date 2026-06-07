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
