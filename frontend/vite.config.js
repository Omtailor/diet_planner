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
        manualChunks: (id) => {
          // Vendor chunk splitting for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('react-hot-toast')) {
              return 'ui-vendor';
            }
            if (id.includes('axios')) {
              return 'api-layer';
            }
            // Other vendor code
            return 'vendor';
          }
        },
      },
    },
    // Minification settings
    minify: 'esbuild', // Use esbuild instead of terser for faster builds
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