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
    // Minification settings - use esbuild for faster, more compatible builds
    minify: 'esbuild',
    // Source maps
    sourcemap: false,
    // Asset inlining threshold
    assetsInlineLimit: 4096, // 4kb
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // CSS code splitting
    cssCodeSplit: true,
    // Rollup options for code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks(id) {
          // Vendor chunk splitting
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            // UI libraries
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('react-hot-toast')) {
              return 'ui-vendor'
            }
            // API layer
            if (id.includes('axios')) {
              return 'api-layer'
            }
            // Other vendor code
            return 'vendor'
          }
        },
      },
    },
  },
  // ✅ Dependency pre-bundling optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'framer-motion'],
  },
})