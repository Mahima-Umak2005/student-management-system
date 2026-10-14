import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // If 5173 is busy, stop instead of silently using another port.
    // (The backend CORS setting expects exactly http://localhost:5173.)
    strictPort: true,
  },
});
