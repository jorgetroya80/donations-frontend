#!/usr/bin/env node
// Entry bundle budget: gzip size of the main `index-*.js` chunk in dist/assets.
// Run `pnpm run build` first.
// Usage: node scripts/bundle-budget.mjs [--max <bytes>]
// Exit: 0 within budget, 1 over budget, 2 could not run.
import { readdirSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const i = process.argv.indexOf('--max')
const max = i > -1 ? Number(process.argv[i + 1]) : 46816

const assets = 'dist/assets'
let entry
try {
  entry = readdirSync(assets).filter((f) => /^index-.*\.js$/.test(f))
} catch {
  console.error('bundle-budget: no dist/assets; run pnpm run build first')
  process.exit(2)
}
if (entry.length !== 1) {
  console.error(`bundle-budget: expected 1 index chunk, found ${entry.length}`)
  process.exit(2)
}

const size = gzipSync(readFileSync(`${assets}/${entry[0]}`)).length
console.log(`bundle-budget: ${entry[0]} ${size} B gzip, max ${max} B`)
process.exit(size <= max ? 0 : 1)
