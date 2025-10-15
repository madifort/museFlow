import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, readFileSync, writeFileSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    // Plugin to copy and fix manifest.json to dist folder
    {
      name: 'copy-manifest',
      writeBundle() {
        try {
          const manifestContent = readFileSync('manifest.json', 'utf8')
          // Fix file extensions in manifest for dist folder
          const fixedManifest = manifestContent
            .replace('serviceWorker.ts', 'serviceWorker.js')
            .replace('extractor.ts', 'extractor.js')
            .replace('public/icons/', 'icons/')
          
          writeFileSync('dist/manifest.json', fixedManifest)
          console.log('✅ Copied and fixed manifest.json to dist folder')
        } catch (error) {
          console.error('❌ Failed to copy manifest.json:', error)
        }
      }
    }
  ],
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
