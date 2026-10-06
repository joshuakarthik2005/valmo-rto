import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

// axe-core on every route and on the main interactive states, against WCAG 2.1 A and AA rules.
// Serious and critical violations fail the test; moderate and minor ones are attached to the report.
const ROUTES = ['/', '/customer', '/rider', '/hub', '/resale', '/impact', '/pilot', '/demo', '/architecture', '/risk']
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function audit(page: Page, label: string) {
  // Audit the settled UI: let entrance animations and transitions finish (axe would otherwise
  // measure contrast on text that is still fading in)
  await page.waitForTimeout(700)
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))))
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const blocking = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  const other = r.violations.filter((v) => !blocking.includes(v))
  const fmt = (vs: typeof r.violations) => vs.map((v) => `${v.impact} ${v.id}: ${v.nodes.length} node(s) e.g. ${v.nodes[0]?.target.join(' ')}`)
  if (other.length) {
    await test.info().attach(`axe-other-${label}`, { body: fmt(other).join(' | '), contentType: 'text/plain' })
    console.log(`[axe-other] ${label} [${test.info().project.name}]: ${fmt(other).join(' | ')}`)
  }
  expect(fmt(blocking), `serious/critical axe violations on ${label}`).toEqual([])
}

for (const r of ROUTES) {
  test(`axe: ${r}`, async ({ page }) => {
    await page.goto(`/#${r}`)
    await expect(page.locator('h1').first()).toBeVisible()
    await audit(page, r)
  })
}

test('axe: interactive states', async ({ page }) => {
  await page.goto('/#/impact')
  await page.getByRole('button', { name: /^Assumptions/ }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await audit(page, 'impact drawer open')
  await page.keyboard.press('Escape')

  await page.goto('/#/customer')
  await page.getByRole('radio', { name: 'In-app order' }).click()
  await page.getByRole('radio', { name: 'हिन्दी' }).click()
  await page.getByRole('button', { name: 'यह ऑर्डर मैंने नहीं किया' }).click()
  await audit(page, 'customer in-app, Hindi, reply chosen')

  await page.goto('/#/resale')
  for (let k = 0; k < 4; k++) await page.getByRole('button', { name: 'Next step' }).click()
  await audit(page, 'resale final step')

  await page.goto('/#/demo?step=11')
  await expect(page.getByTestId('caption')).toBeVisible()
  await audit(page, 'demo final step')
})
