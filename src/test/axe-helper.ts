import axe, { type AxeResults } from 'axe-core'
import { expect } from 'vitest'

// jsdom has no layout, so color-contrast cannot be measured here. Contrast needs a browser run.
// `region` asks for landmarks around the whole page. These tests render one page body at a time.
const DISABLED_RULES = {
  'color-contrast': { enabled: false },
  region: { enabled: false },
}

export async function expectNoSeriousA11yViolations(container: HTMLElement) {
  const results: AxeResults = await axe.run(container, {
    rules: DISABLED_RULES,
    resultTypes: ['violations'],
  })
  const serious = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  )
  expect(
    serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s)`)
  ).toEqual([])
}
