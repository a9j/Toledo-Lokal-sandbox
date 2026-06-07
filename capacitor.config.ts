import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.toledolokal.app',
  appName: 'Toledo Lokal',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
};

export default config;
