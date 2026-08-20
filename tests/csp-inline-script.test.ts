import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// The theme script in index.html has to run before first paint, so it is
// inline, and script-src 'self' blocks inline scripts. nginx allows this one by
// its sha256. Nothing at runtime notices when they drift: dev serves no CSP, so
// the breakage only shows in production, as a light flash on every load for
// dark mode users.
describe('CSP hash for the inline theme script', () => {
  it('matches the script in index.html', () => {
    const html = readFileSync('index.html', 'utf8')
    const script = html.match(
      /<script(?![^>]*\ssrc)[^>]*>([\s\S]*?)<\/script>/
    )?.[1]
    expect(script, 'no inline script found in index.html').toBeDefined()

    const hash = `sha256-${createHash('sha256')
      .update(script as string, 'utf8')
      .digest('base64')}`
    const nginx = readFileSync('security-headers.conf', 'utf8')

    expect(
      nginx,
      `index.html's inline script hashes to '${hash}'. Update script-src in security-headers.conf.`
    ).toContain(`'${hash}'`)
  })
})
