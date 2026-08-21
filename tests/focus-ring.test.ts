import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

// WCAG 2.2 SC 1.4.11 asks for 3:1 on the focus indicator. Any alpha on the ring
// token puts it under that: the old `ring-ring/50` measured 1.54:1 on the light
// background, and darkening the token without dropping the alpha only reaches
// 2.32:1 — both changes have to hold together. Nothing at runtime notices when
// one drifts back; the ring just quietly stops being visible enough.
//
// The destructive-variant rings (`ring-destructive/20`, `/40`) fail the same
// criterion and are handled in phase 2 of docs/plans/focus-ring-wcag.md.
const ALPHA_RING = /(?:ring|outline)-ring\/\d+/g

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.(tsx?|css)$/.test(entry.name) ? [full] : []
  })
}

describe('focus indicator', () => {
  it('never paints the ring with an alpha-reduced token', () => {
    const offenders = sourceFiles('src').flatMap((file) => {
      const matches = readFileSync(file, 'utf8').match(ALPHA_RING) ?? []
      return matches.map((match) => `${relative('src', file)}: ${match}`)
    })

    expect(offenders).toEqual([])
  })

  it('uses a ring token that clears 3:1 against its surface in both themes', () => {
    const css = readFileSync('src/index.css', 'utf8')

    // 7.44:1 on --background, 6.82:1 on --muted
    expect(css).toContain('--ring: oklch(0.45 0 0)')
    // 11.33:1 on --card, 12.52:1 on --background
    expect(css).toContain('--ring: oklch(0.85 0 0)')
  })
})
