import { defineConfig, loadEnv, normalizePath } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const appDirectory = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, appDirectory, '');
  const username = env.GEOSERVER_USERNAME;
  const password = env.GEOSERVER_PASSWORD;

  return {
    define: {
      CESIUM_BASE_URL: JSON.stringify('/cesium/'),
    },
    plugins: [
      react(),
      tailwindcss(),
      viteStaticCopy({
        targets: [
          { src: normalizePath(resolve(appDirectory, 'node_modules/cesium/Build/Cesium/Workers/**/*')), dest: 'cesium/Workers' },
          { src: normalizePath(resolve(appDirectory, 'node_modules/cesium/Build/Cesium/ThirdParty/**/*')), dest: 'cesium/ThirdParty' },
          { src: normalizePath(resolve(appDirectory, 'node_modules/cesium/Build/Cesium/Assets/**/*')), dest: 'cesium/Assets' },
          { src: normalizePath(resolve(appDirectory, 'node_modules/cesium/Build/Cesium/Widgets/**/*')), dest: 'cesium/Widgets' },
        ],
      }),
    ],
    server: {
      proxy: {
        '/geoserver': {
          target: 'http://localhost:8081',
          changeOrigin: true,
          ...(username && password ? { auth: username + ':' + password } : {}),
        },
      },
    },
  };
});
