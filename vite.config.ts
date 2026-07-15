import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR can be disabled via DISABLE_HMR env var to prevent flickering during automated edits.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Proxy API requests to Express backend
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        }
      }
    },
    // SPA fallback for React Router client-side routes is the default in Vite 6
    build: {
      // Split vendor code (node_modules) out of the app chunk so the app
      // payload is small and vendors cache independently. Grouped by top-level
      // package so large libs (firebase, supabase, googleapis, recharts, …)
      // land in their own chunks.
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              const match = id.split('node_modules/')[1].split('/')[0];
              // Scoped packages: take the scope+name
              if (match.startsWith('@')) {
                return 'vendor_' + id.split('node_modules/')[1].split('/').slice(0, 2).join('_');
              }
              return 'vendor_' + match;
            }
          },
        },
      },
    },
  };
});
