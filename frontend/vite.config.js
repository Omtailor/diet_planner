import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // ✅ Restrict dev server to localhost only — prevents HMR exposure on LAN
  server: {
    host: '127.0.0.1',
    strictPort: true,
    port: 5173,
  },
})