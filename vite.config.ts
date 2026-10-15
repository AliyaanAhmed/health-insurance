import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'] },
  optimizeDeps: {
    include: ['react', 'react-dom/client', 'react/jsx-runtime', '@phosphor-icons/react'],
  },
  server: {
    watch: { awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 10 } },
  },
})
