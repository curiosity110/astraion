import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // ← add

const backendHost = process.env.VITE_BACKEND_HOST || 'localhost'

export default defineConfig({
  plugins: [react(), tailwindcss()],        // ← add
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: { usePolling: true },
    proxy: {
      '/api': { target: `http://${backendHost}:8000`, changeOrigin: true },
      '/ws':  { target: `ws://${backendHost}:8000`, ws: true, changeOrigin: true },
    },
  },
})
