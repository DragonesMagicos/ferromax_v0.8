import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  define: {
    global: 'globalThis',
  },

  resolve: {
    alias: { '@': '/src' },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8081',
        ws: true,
        changeOrigin: true,
      },
    },
  },

  test: {
    environment: 'jsdom',
    env: {
      // Solo se usa durante "vitest run" — no afecta tu .env real de dev/producción
      VITE_API_URL: 'http://localhost:3000',
    },
  },
})