import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Stardust is a fully static single-page app — no server, no env-time secrets.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    // Three.js is large; raise the warning ceiling so the build stays quiet.
    chunkSizeWarningLimit: 1500,
  },
});
