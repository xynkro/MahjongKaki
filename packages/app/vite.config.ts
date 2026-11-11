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
      // No update prompt exists in the UI, so 'prompt' left new versions waiting until every window closed.
      registerType: 'autoUpdate',
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
        // Small art (webp/jpg/png) is precached for offline use. The unit intro clips
        // (~6 MB together) are not: each is cached the first time it is played.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,woff2}'],
        globIgnores: ['**/video/*.mp4', 'app-icon.png'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/video/') && url.pathname.endsWith('.mp4'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'mk-intro-video',
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 12 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
}));
