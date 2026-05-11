import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
  ],

  // ── Critical: prevent duplicate React instances (causes Error #306) ──────────
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },

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

  build: {
    // Enable source maps for production debugging on Vercel
    sourcemap: true,
    rollupOptions: {
      output: {
        // ✅ FIX: manualChunks MUST be a function in Vite 6+ (Rolldown).
        // The object form was silently accepted by older Rollup but throws
        // "TypeError: manualChunks is not a function" in Rolldown.
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
            return 'router';
          }
          if (id.includes('node_modules/gsap/') || id.includes('node_modules/canvas-confetti/')) {
            return 'animation';
          }
        }
      }
    }
  }
});
