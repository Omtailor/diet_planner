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
  // ✅ Production build optimizations
  build: {
    // Enable code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - cached separately from app code
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react', 'react-hot-toast'],
          // API layer - changes less frequently
          'api-layer': ['axios'],
        },
      },
    },
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'], // Remove specific console calls
      },
    },
    // Source maps for debugging (but hidden from users)
    sourcemap: false, // Set to 'hidden' if you need sourcemaps for error tracking
    // Asset inlining threshold
    assetsInlineLimit: 4096, // 4kb - inline smaller assets as base64
    // Chunk size warnings
    chunkSizeWarningLimit: 1000, // Warn if chunk > 1MB
    // CSS code splitting
    cssCodeSplit: true,
  },
  // ✅ Dependency pre-bundling optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'framer-motion'],
    exclude: [], // Add any deps that should not be pre-bundled
  },
})