import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Конфигурация Vite для React приложения
export default defineConfig({
  plugins: [react()],
  base: '/_ui/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/_ws': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
});
