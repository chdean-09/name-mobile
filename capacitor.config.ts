import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.name.smartlock',
  appName: 'N.A.M.E',
  webDir: 'out',
  server: {
<<<<<<< HEAD
    "url": "http://192.168.1.20:3000",
=======
    "url": "http://10.10.10.100:3000",
>>>>>>> main
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
