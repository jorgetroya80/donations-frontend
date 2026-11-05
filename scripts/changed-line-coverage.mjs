#!/usr/bin/env node
// Coverage of changed lines: share of added src lines that the test run executed.
// Reads coverage/coverage-final.json, so run `pnpm run test:coverage` first.
// Usage: node scripts/changed-line-coverage.mjs [--base <ref>] [--min <percent>]
// Exit: 0 at or above the minimum (or nothing executable changed), 1 below, 2 could not run.
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : fallback
}
const base = arg('--base', 'origin/main')
const min = Number(arg('--min', '80'))
const bail = (msg) => {
  console.error('changed-line-coverage: ' + msg)
  process.exit(2)
}

const git = (args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
let top, mergeBase
try {
  top = git(['rev-parse', '--show-toplevel']).trim()
  mergeBase = git(['merge-base', base, 'HEAD']).trim()
} catch {
  bail('not a git work tree, or no merge base against ' + base)
}
process.chdir(top)

const coveragePath = path.join(top, 'coverage/coverage-final.json')
if (!existsSync(coveragePath))
  bail('no coverage/coverage-final.json; run pnpm run test:coverage first')
const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'))

// Added line numbers per src file: from tracked diff hunks, and every line of untracked files.
const changed = new Map()
const addLines = (f, from, count) => {
  if (!changed.has(f)) changed.set(f, new Set())
  for (let n = from; n < from + count; n++) changed.get(f).add(n)
}
let current = null
for (const line of git(['diff', '--unified=0', mergeBase, '--', 'src']).split(
  '\n'
)) {
  if (line.startsWith('+++ '))
    current = line.startsWith('+++ b/') ? line.slice(6) : null
  const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/)
  if (hunk && current)
    addLines(
      current,
      Number(hunk[1]),
      hunk[2] === undefined ? 1 : Number(hunk[2])
    )
}
for (const f of git(['ls-files', '--others', '--exclude-standard', '--', 'src'])
  .split('\n')
  .filter(Boolean)) {
  addLines(f, 1, readFileSync(f, 'utf8').split('\n').length)
}

// A line counts when a statement starts on it. It is covered when that statement ran at least once.
let counted = 0,
  covered = 0
const report = []
for (const [rel, lines] of changed) {
  const entry = coverage[path.join(top, rel)]
  if (!entry) continue // not in the coverage include list (tests, layouts, excluded files)
  const hitsByLine = new Map()
  for (const [id, { start }] of Object.entries(entry.statementMap)) {
    const hit = entry.s[id] > 0
    hitsByLine.set(start.line, (hitsByLine.get(start.line) ?? false) || hit)
  }
  const uncovered = []
  for (const n of [...lines].sort((a, b) => a - b)) {
    if (!hitsByLine.has(n)) continue
    counted++
    if (hitsByLine.get(n)) covered++
    else uncovered.push(n)
  }
  if (uncovered.length)
    report.push(
      `  ${rel}: lines ${uncovered.slice(0, 5).join(', ')}${uncovered.length > 5 ? ', …' : ''}`
    )
}

if (counted === 0) {
  console.log('changed-line-coverage: no executable changed lines')
  process.exit(0)
}
const pct = (covered / counted) * 100
console.log(
  `changed-line-coverage: ${pct.toFixed(1)}% (${covered}/${counted}), minimum ${min}%`
)
if (report.length) console.log('uncovered changed lines:\n' + report.join('\n'))
process.exit(pct >= min ? 0 : 1)
