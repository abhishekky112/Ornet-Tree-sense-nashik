import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    sourcemap: true,
  },
  server: {
    host: '0.0.0.0', // allows access from LAN
    port: 5173,      // or any port you like
  }
});
