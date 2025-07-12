import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.name.smartlock',
  appName: 'N.A.M.E',
  webDir: 'out',
  server: {
    "url": "http://192.168.1.20:3000",
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
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      // resizeOnFullScreen: true,
    },
  },
};

export default config;
