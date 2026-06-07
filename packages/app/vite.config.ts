import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves this project site under /MahjongKaki/. Only apply that
// base for production builds so the local dev server stays at root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/MahjongKaki/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'MahjongKaki',
        short_name: 'MahjongKaki',
        description: 'Singapore Mahjong Companion',
        theme_color: '#161310',
        background_color: '#161310',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
}));
