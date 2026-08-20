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

// The only subset this Spanish-only app ever fetches; cyrillic and latin-ext
// stay behind their unicode-range and must not be preloaded.
const LATIN_FONT = /geist-latin-wght-normal-[^/]*\.woff2$/

// The font sits at the end of a three-hop chain - html, css, then woff2 - so it
// is not discoverable until the CSS parses. A preload flattens that. The
// filename is content hashed, so it is read from the bundle rather than
// hardcoded.
function preloadLatinFont(): Plugin {
  return {
    name: 'preload-latin-font',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const font = Object.keys(ctx.bundle ?? {}).find((name) =>
          LATIN_FONT.test(name)
        )
        if (!font) {
          this.warn('No latin geist woff2 in the bundle; skipping preload.')
          return
        }

        return [
          {
            tag: 'link',
            // crossorigin is required even same-origin: font requests are
            // CORS mode, and without it the browser fetches the file twice.
            attrs: {
              rel: 'preload',
              as: 'font',
              type: 'font/woff2',
              href: `/${font}`,
              crossorigin: '',
            },
            injectTo: 'head-prepend',
          },
        ]
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({}),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    preloadLatinFont(),
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
