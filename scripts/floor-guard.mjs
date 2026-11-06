#!/usr/bin/env node
// Diff-scoped enforcement of the CONSTRAINTS.md floor.
// Usage: node scripts/floor-guard.mjs [--base <ref>]   (default base: origin/main)
// Exit: 0 clean, 1 floor violation, 2 guard could not run.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const base = (() => {
  const i = process.argv.indexOf('--base')
  return i > -1 ? process.argv[i + 1] : 'origin/main'
})()

// `git diff --no-index` exits 1 whenever the two sides differ, which is the normal case for a
// new file, so that output is kept. Any other failure is null, and null never reads as clean.
const git = (args, { diffExit = false } = {}) => {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (e) {
    return diffExit && e.status === 1 && typeof e.stdout === 'string'
      ? e.stdout
      : null
  }
}
const bail = (msg) => {
  console.error('floor-guard: ' + msg)
  process.exit(2)
}

const top = git(['rev-parse', '--show-toplevel'])?.trim()
if (!top) bail('not inside a git work tree')
process.chdir(top)

const mergeBase = git(['merge-base', base, 'HEAD'])?.trim()
if (!mergeBase) bail('no merge base against ' + base)

const tracked = git(['diff', '--unified=0', mergeBase, '--'])
if (tracked === null) bail('could not diff against ' + mergeBase)
const untrackedFiles = git(['ls-files', '--others', '--exclude-standard'])
if (untrackedFiles === null) bail('could not list untracked files')
const untracked = untrackedFiles
  .split('\n')
  .filter(Boolean)
  .map((f) => {
    const d = git(['diff', '--no-index', '--unified=0', '/dev/null', f], {
      diffExit: true,
    })
    if (d === null) bail('could not diff untracked file ' + f)
    return d
  })
  .join('\n')
const diff = tracked + '\n' + untracked

// `---` and `+++` are file headers only between a file's `diff` line and its first `@@` hunk.
const added = [],
  removed = [],
  deleted = []
const pathOf = (s) => s.replace(/^[ab]\//, '')
let file = '',
  oldFile = '',
  inHeader = false
for (const line of diff.split('\n')) {
  if (line.startsWith('diff ')) inHeader = true
  else if (line.startsWith('@@')) inHeader = false
  else if (inHeader) {
    if (line.startsWith('--- ')) oldFile = pathOf(line.slice(4))
    else if (line.startsWith('+++ ')) {
      const newFile = pathOf(line.slice(4))
      file = newFile === '/dev/null' ? oldFile : newFile
      if (newFile === '/dev/null') deleted.push(file)
    }
  } else if (line.startsWith('+')) added.push({ file, text: line.slice(1) })
  else if (line.startsWith('-')) removed.push({ file, text: line.slice(1) })
}

const findings = []
const flag = (rule, f, text) =>
  findings.push({ rule, file: f, text: text.trim().slice(0, 120) })
const isTest = (f) => /\.(test|spec)\.|_test\.|test_/.test(f)
const isConstraints = (f) => /CONSTRAINTS\.md$/.test(f)
// The rule text and this guard quote the patterns they police; scanning them would flag themselves.
const isSelf = (f) => isConstraints(f) || /floor-guard\.mjs$/.test(f)

// Exceptions: a row in CONSTRAINTS.md is an approved exception only when a commit in this branch
// carries `Exception: <ID>`. The trailer is the approval record; review checks its author is not the
// PR author. Rows past their Expires date fail the guard until removed or renewed with a new row.
const EXCEPTION_ROW = /^\| *([WE]\d+) *\|/
const messages = git(['log', '--format=%B', `${mergeBase}..HEAD`])
if (messages === null) bail('could not read commits since ' + mergeBase)
const approved = new Set(
  [...messages.matchAll(/^Exception: ([WE]\d+)$/gm)].map((m) => m[1])
)

const SUPPRESSIONS =
  /@ts-ignore|@ts-nocheck|eslint-disable|oxlint-disable|biome-ignore|# *noqa|# *type: *ignore|istanbul ignore|nosemgrep|gitleaks:allow|Stryker disable/
const STUBS =
  /throw new (Error|NotImplemented).*[Nn]ot implemented|catch\s*\(\w*\)\s*\{\s*\}|catch\s*\{\s*\}|\bTODO\b|\bpass\s*# *stub/
const SKIPS =
  /\.(skip|todo)\b|\bxit\(|\bxdescribe\(|@pytest\.mark\.skip|t\.Skip\(/

for (const { file, text } of added) {
  if (isSelf(file)) {
    const row = isConstraints(file) && text.match(EXCEPTION_ROW)
    if (row && !approved.has(row[1])) flag('unapproved-exception', file, text)
    continue
  }
  if (SUPPRESSIONS.test(text)) flag('silenced-checker', file, text)
  if (STUBS.test(text)) flag('unfinished-work', file, text)
  if (SKIPS.test(text)) flag('test-made-easier', file, text)
}

for (const f of deleted) if (isTest(f)) flag('test-deleted', f, 'file deleted')
for (const { file, text } of removed) {
  if (
    isTest(file) &&
    !deleted.includes(file) &&
    /\b(expect|assert|should)\b/.test(text)
  ) {
    flag('assertion-removed', file, text)
  }
}

// A rule in CONSTRAINTS.md weakened or removed. Numbers carry a direction from the words around them.
const ruleKey = (t) => {
  const s = t.trim()
  // A table separator (`| --- | --- |`) is layout, not a rule. The formatter realigns it.
  if (/^\|[\s:|-]+\|$/.test(s)) return null
  if (s.startsWith('|'))
    return (
      s
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean)[0] ?? ''
    )
  if (/^[-*] /.test(s)) return s.slice(2).split(':')[0].trim()
  return null
}
const isException = (t) => /^\| *(W|E)\d+ *\|/.test(t.trim())
const MIN_BEFORE =
  /(>=|>|≥|at least|minimum|\bmin\b|no less than|not fall|not drop)\s*$/
const MAX_BEFORE =
  /(<=|<|≤|at most|maximum|\bmax\b|no more than|under|below|not grow|not exceed)\s*$/
const MIN_AFTER = /^\s*\S*\s*(or more|or higher|must not fall|must not drop)/
const MAX_AFTER = /^\s*\S*\s*(or less|or lower|must not grow|must not exceed)/
const thresholds = (t) => {
  const out = [],
    re = /\d+(?:\.\d+)?/g
  let m
  while ((m = re.exec(t))) {
    const before = t.slice(Math.max(0, m.index - 24), m.index).toLowerCase()
    const after = t
      .slice(m.index + m[0].length, m.index + m[0].length + 40)
      .toLowerCase()
    const dir =
      MIN_BEFORE.test(before) || MIN_AFTER.test(after)
        ? 'min'
        : MAX_BEFORE.test(before) || MAX_AFTER.test(after)
          ? 'max'
          : null
    out.push({ n: Number(m[0]), dir })
  }
  return out
}
const removedRules = removed.filter(
  (l) => isConstraints(l.file) && ruleKey(l.text) !== null
)
const addedRules = added.filter(
  (l) => isConstraints(l.file) && ruleKey(l.text) !== null
)
for (const r of removedRules) {
  const a = addedRules.find((x) => ruleKey(x.text) === ruleKey(r.text))
  if (!a) {
    if (!isException(r.text)) flag('rule-removed', r.file, r.text)
    continue
  }
  const before = thresholds(r.text),
    after = thresholds(a.text)
  let verdict = null
  for (const dir of ['min', 'max', null]) {
    const was = before.filter((x) => x.dir === dir),
      now = after.filter((x) => x.dir === dir)
    was.forEach((b, i) => {
      const n = now[i]
      if (verdict) return
      if (!n) verdict = 'threshold-removed'
      else if (n.n === b.n) return
      else if (dir === 'min' ? n.n < b.n : dir === 'max' ? n.n > b.n : true) {
        verdict = dir ? 'threshold-loosened' : 'threshold-changed'
      }
    })
  }
  if (verdict) flag(verdict, r.file, r.text + '  ->  ' + a.text)
}

// Expired exceptions: any row whose Expires cell (last column) is before today.
let constraints
try {
  constraints = readFileSync('CONSTRAINTS.md', 'utf8')
} catch {
  bail('could not read CONSTRAINTS.md')
}
const today = new Date().toISOString().slice(0, 10)
for (const line of constraints.split('\n')) {
  if (!EXCEPTION_ROW.test(line)) continue
  const expires = line
    .split('|')
    .map((c) => c.trim())
    .filter(Boolean)
    .at(-1)
  if (expires < today) flag('exception-expired', 'CONSTRAINTS.md', line)
}

if (findings.length === 0) {
  console.log('floor-guard: clean')
  process.exit(0)
}
console.error('floor-guard: ' + findings.length + ' floor violation(s):')
for (const f of findings) console.error(`  [${f.rule}] ${f.file}: ${f.text}`)
console.error(
  '\nEach is a move that lowers the bar. Fix the code, or route it through a tracked exception.'
)
process.exit(1)
