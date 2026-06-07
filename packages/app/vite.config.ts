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
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MahjongKaki',
        short_name: 'MahjongKaki',
        description: 'Singapore Mahjong Companion',
        theme_color: '#161310',
        background_color: '#161310',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
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
