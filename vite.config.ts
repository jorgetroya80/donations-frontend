import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, type Plugin, type ProxyOptions } from 'vite'

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

// Matches gzip_min_length in default.conf.template.
const GZIP_MIN_BYTES = 1024
const COMPRESSIBLE = /\.(?:js|css|svg)$/

// Writes a level-9 .gz next to each compressible asset. nginx has gzip_static
// on, so it serves these instead of recompressing immutable bytes per request
// — and at a level the per-request path can't afford. Assets are content
// hashed, so the .gz never goes stale.
function gzipAssets() {
  return {
    name: 'gzip-assets',
    apply: 'build',
    writeBundle(options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (!COMPRESSIBLE.test(fileName)) continue

        const source = chunk.type === 'chunk' ? chunk.code : chunk.source
        const raw = Buffer.from(source)
        if (raw.byteLength < GZIP_MIN_BYTES) continue

        const target = path.join(options.dir ?? 'dist', fileName)
        writeFileSync(`${target}.gz`, gzipSync(raw, { level: 9 }))
      }
    },
  } satisfies Plugin
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({}),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    gzipAssets(),
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
