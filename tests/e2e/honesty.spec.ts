import { test, expect } from './fixtures'

// Honesty checks for the v3 pages: required labels present, overclaiming words absent.
const BANNED = /\b(validated|proven|guarantee[ds]?|AI-powered|machine learning)\b/i
// `reveal` opens every state of the page (e.g. each scenario) so all of its text is checked, not just the first view
const PAGES: { route: string; mustShow: RegExp; reveal?: string }[] = [
  { route: '/scenarios', mustShow: /simulated/i, reveal: 'nav[aria-label="Failure cases"] button' },
  { route: '/risk', mustShow: /illustrative/i },
  { route: '/architecture', mustShow: /proposal/i },
  { route: '/impact', mustShow: /assumption ranges, not confidence intervals/i },
]

for (const p of PAGES) {
  test(`honesty: #${p.route} shows its label and no overclaims`, async ({ page }) => {
    await page.goto(`/#${p.route}`)
    await expect(page.locator('h1').first()).toBeVisible()
    const states: string[] = [await page.locator('main').innerText()]
    if (p.reveal) {
      const buttons = page.locator(p.reveal)
      for (let k = 0; k < (await buttons.count()); k++) {
        await buttons.nth(k).click()
        states.push(await page.locator('main').innerText())
      }
    }
    expect(states[0]).toMatch(p.mustShow)
    for (const text of states) expect(text.match(BANNED)?.[0] ?? null, 'overclaiming word on the page').toBeNull()
  })
}
