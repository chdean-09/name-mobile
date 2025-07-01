import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.name.smartlock',
  appName: 'name-mobile',
  webDir: 'out',
  server: {
    "url": "http://192.168.1.11:3000",
    "cleartext": true
  },
};

export default config;
