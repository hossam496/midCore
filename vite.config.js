import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Development proxy — forwards /api and /uploads to local backend
    // In production (Vercel), VITE_API_URL is used directly in axiosInstance
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/doctors': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/chat': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
    hmr: true,
  },
});
