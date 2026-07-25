import path from 'node:path'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

const PORT = 3000
// Below the current entry chunk on purpose, so oversized chunks are visible
// at build time instead of passing silently under Vite's 500 kB default.
const CHUNK_SIZE_WARNING_KB = 300

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({}),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    // pnpm run analyze
    process.env.ANALYZE &&
      visualizer({ filename: 'dist/stats.html', gzipSize: true }),
  ],
  build: {
    chunkSizeWarningLimit: CHUNK_SIZE_WARNING_KB,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: PORT,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
          })
        },
      },
    },
  },
})
