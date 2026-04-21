import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000',
      },
    },
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/components/ui/**',
        'src/components/date-range-picker.tsx',
        'src/layouts/**',
        'src/lib/utils.ts',
        'src/lib/i18n.ts',
        'src/main.tsx',
        'src/App.tsx',
        'src/vite-env.d.ts',
      ],
    },
  },
})
