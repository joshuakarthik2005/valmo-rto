import { test, expect } from './fixtures'
import { baseline, combined, move1, move2, lakh, pct, pctTrim, count } from '../../src/lib/model'

// Fresh context per test, no auth: every route loads with zero console errors,
// and the impact numbers on screen equal the model's output.
const ROUTES = ['/', '/customer', '/rider', '/hub', '/resale', '/impact', '/pilot', '/demo', '/architecture', '/risk']

for (const r of ROUTES) {
  test(`route #${r} loads with no console errors`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(`/#${r}`, { waitUntil: 'networkidle' })
    await expect(page.getByText('Prototype: simulated data').first()).toBeVisible()
    await expect(page.locator('h1').first()).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('impact numbers on screen match the model', async ({ page }) => {
  const b = baseline()
  const lo = combined('conservative')
  const hi = combined('ceiling')
  await page.goto('/#/impact', { waitUntil: 'networkidle' })
  const body = page.locator('main')
  await expect(page.getByTestId('net')).toHaveText(lakh(lo.net))
  for (const text of [
    `${pct(lo.shareOfDrag)} of the ${lakh(b.trueDrag)} true drag`,
    `Range at these inputs: ${lakh(lo.net)} to ${lakh(hi.net)}`,
    lakh(move1('conservative').net, 2),
    `${count(move1('conservative').orders)} RTOs prevented`,
    lakh(move2('sequenced', 'conservative').net),
    `${pctTrim(lo.rtoRateAfter)}`,
    `${pctTrim(hi.rtoRateAfter)}`,
  ]) await expect(body).toContainText(text)
  await page.getByRole('radio', { name: 'Ceiling (illustrative)' }).click()
  await expect(page.getByTestId('net')).toHaveText(lakh(hi.net))
  await expect(body).toContainText(`${pct(hi.shareOfDrag)} of the ${lakh(b.trueDrag)} true drag`)
})
