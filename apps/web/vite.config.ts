import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // The 3D island chunk is large but lazy-loaded, so the board never downloads it.
  build: { chunkSizeWarningLimit: 1100 },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:4777',
      '/ws': { target: 'ws://127.0.0.1:4777', ws: true },
    },
  },
});
