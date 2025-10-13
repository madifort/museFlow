import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        options: resolve(__dirname, 'options.html'),
        'service-worker': resolve(__dirname, 'src/background/serviceWorker.ts'),
        'content-script': resolve(__dirname, 'src/content/extractor.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'service-worker') {
            return 'src/background/serviceWorker.js'
          }
          if (chunkInfo.name === 'content-script') {
            return 'src/content/extractor.js'
          }
          return 'assets/[name]-[hash].js'
        }
      }
    },
    copyPublicDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
