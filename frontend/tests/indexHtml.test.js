// @vitest-environment node

import { readFileSync } from 'node:fs'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

it('boots the stored theme before the app module', () => {
  const themeIndex = html.indexOf('review-well-theme')
  const moduleIndex = html.indexOf('/src/main.jsx')

  expect(themeIndex).toBeGreaterThan(-1)
  expect(themeIndex).toBeLessThan(moduleIndex)
  expect(html).toMatch(/try\s*{[\s\S]*localStorage[\s\S]*catch/)
})
