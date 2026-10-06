import { test, expect } from './fixtures'

// Honesty checks for the v3 pages: required labels present, overclaiming words absent.
const BANNED = /\b(validated|proven|guarantee[ds]?|AI-powered|machine learning)\b/i
const PAGES: { route: string; mustShow: RegExp }[] = [
  { route: '/risk', mustShow: /illustrative/i },
  { route: '/architecture', mustShow: /proposal/i },
]

for (const p of PAGES) {
  test(`honesty: #${p.route} shows its label and no overclaims`, async ({ page }) => {
    await page.goto(`/#${p.route}`)
    await expect(page.locator('h1').first()).toBeVisible()
    const text = await page.locator('main').innerText()
    expect(text).toMatch(p.mustShow)
    expect(text.match(BANNED)?.[0] ?? null, 'overclaiming word on the page').toBeNull()
  })
}
