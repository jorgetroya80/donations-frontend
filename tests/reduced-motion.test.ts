import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

// Reduced motion means fewer and gentler animations, not none: nothing should
// slide, scale or rotate, but fades still help people follow what changed.
// jsdom does not evaluate media queries, so this guards the CSS source.
const css = readFileSync('src/index.css', 'utf8')

// Brace-match the block so the test does not depend on how it is indented.
function mediaBlock(source: string, query: string): string {
  const start = source.indexOf(`@media ${query}`)
  if (start === -1) return ''
  const open = source.indexOf('{', start)
  let depth = 0
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}' && --depth === 0)
      return source.slice(open + 1, i)
  }
  return ''
}
const block = mediaBlock(css, '(prefers-reduced-motion: reduce)')

const MOVEMENT_VARS = ['enter', 'exit'].flatMap((phase) =>
  ['translate-x', 'translate-y', 'scale', 'rotate'].map(
    (prop) => `--tw-${phase}-${prop}`
  )
)

describe('reduced motion', () => {
  it('has a prefers-reduced-motion block', () => {
    expect(block).not.toBe('')
  })

  it('keeps fade durations instead of cutting every animation to zero', () => {
    expect(block).not.toMatch(/transition-duration/)
    expect(block).not.toMatch(/animation-duration/)
  })

  it('removes slide, zoom and spin from enter and exit animations', () => {
    for (const name of MOVEMENT_VARS) {
      expect(block).toContain(`${name}: initial !important`)
    }
  })

  it('transitions only non-movement properties', () => {
    const list = block.match(/transition-property:([^;]*);/)?.[1] ?? ''
    expect(list).toContain('opacity')
    expect(list).not.toMatch(/translate|transform|rotate|scale|width|height/)
  })
})
