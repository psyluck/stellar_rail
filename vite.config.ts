// ─────────────────────────────────────────────────────────────────────────────
// CenDTrus Remit — Vite Configuration
// Configures the Vue 3 + TypeScript dev server with a proxy to the
// Express backend running on port 3001, avoiding CORS issues in dev.
// ─────────────────────────────────────────────────────────────────────────────

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [
    // Enable Vue 3 SFC support (single-file components)
    vue(),
  ],

  resolve: {
    alias: {
      // Allow "@/..." imports to resolve from src/
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      // Proxy all /api/* requests to the Express adapter during development.
      // In production, both are served from the same origin.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },

  build: {
    // Output to dist/ for deployment
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Chunk vendor libraries separately for better caching
        manualChunks: {
          stellar: ['@stellar/stellar-sdk'],
          vue: ['vue'],
        },
      },
    },
  },
})
