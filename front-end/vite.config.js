import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.nextTick': '((fn, ...args) => setTimeout(() => fn(...args), 0))',
  },
  resolve: {
    alias: {
      util: 'util/',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
})
