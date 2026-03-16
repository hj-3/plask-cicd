import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // The local backend (when running via `npm run dev`) listens on 3002 by default.
        // This must match backend/.env PORT or the port you pass to the backend server.
        target: 'http://10.152.140.150:3002',
        changeOrigin: true,
        // Keep the /api prefix when proxying so it matches the backend routes.
        // The backend defines routes like /api/auth/login, /api/courses, etc.
      },
    },
    watch: {
      usePolling: true,
    }
  },
});
