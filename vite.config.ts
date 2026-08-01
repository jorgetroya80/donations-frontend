import path from 'node:path'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, type ProxyOptions } from 'vite'

const PORT = 3000
// Shared by dev and preview so a production build can be measured against the
// local API. Without it `vite preview` has no /api and only /login is reachable.
const apiProxy: Record<string, ProxyOptions> = {
  '/api': {
    target: 'http://localhost:8081',
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin')
      })
    },
  },
}
// Just above the recharts chart chunk, which is the largest chunk we can't
// shrink without replacing the library. Low enough to catch real growth,
// reachable enough that a green build still means something.
const CHUNK_SIZE_WARNING_KB = 360

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
    rolldownOptions: {
      output: {
        // React changes far less often than app code, so keeping it out of
        // the entry chunk stops every deploy from invalidating it. Same total
        // bytes on first load — this only helps repeat visits.
        // react/react-dom/scheduler must stay in one group: splitting them
        // apart risks cross-chunk circular initialization at runtime.
        advancedChunks: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: PORT,
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
})
