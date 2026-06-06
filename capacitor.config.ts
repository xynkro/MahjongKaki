import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mahjongkaki.app',
  appName: 'MahjongKaki',
  webDir: 'packages/app/dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
