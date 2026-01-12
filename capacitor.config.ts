import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hsa.foodwaste',
  appName: 'HSA Food Waste',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    Keyboard: {
      resize: 'body', // يجعل الـ body يتقلص عند ظهور الكيبورد
      resizeOnFullScreen: true,
    },
  },
};

export default config;
