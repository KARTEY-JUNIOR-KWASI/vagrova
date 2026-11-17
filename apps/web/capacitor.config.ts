import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vagrova.app',
  appName: 'Vagrova',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
