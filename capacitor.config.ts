import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.name.smartlock',
  appName: 'N.A.M.E',
  webDir: 'out',
  server: {
    "url": "http://192.168.209.243:3000",
    "cleartext": true
  },
  plugins: {
    SafeArea: {
      enabled: false,
      customColorsForSystemBars: true,
      statusBarColor: '#ffffff',
      statusBarContent: 'dark',
      navigationBarColor: '#000000',
      navigationBarContent: 'dark',
      offset: 0,
    },
  },
};

export default config;
