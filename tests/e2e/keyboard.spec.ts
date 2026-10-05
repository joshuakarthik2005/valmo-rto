import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

/** Name of the focused element plus whether its focus ring is visible (outline drawn, at least 2px). */
async function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body) return { name: '(body)', ring: false }
    const cs = getComputedStyle(el)
    const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2
    const name = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40)
    return { name, ring }
  })
}

async function tabTo(page: Page, name: string, max = 60) {
  for (let k = 0; k < max; k++) {
    await page.keyboard.press('Tab')
    const f = await focused(page)
    expect(f.ring, `focus ring visible on "${f.name}"`).toBe(true)
    if (f.name === name) return
  }
  throw new Error(`"${name}" not reachable by Tab`)
}

test('demo: the whole tour is operable from the keyboard, with a visible focus ring at every stop', async ({ page }) => {
  await page.goto('/#/demo')
  const cap = page.getByTestId('caption')
  await expect(cap).toContainText('17%')

  // Pause with Enter on the Pause button
  await tabTo(page, 'Pause')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Play' })).toBeFocused()
  // Space on the focused button presses it exactly once (resume), not twice
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Pause' })).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()

  // Skip through all 11 steps with the keyboard
  await tabTo(page, 'Skip')
  for (let k = 0; k < 10; k++) await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/step=11/)
  await expect(cap).toContainText('Open the repo from the card below')
  await expect(page.getByTestId('demo-stage').getByRole('heading', { name: 'Verify it yourself' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Skip' })).toBeDisabled()

  // Back and Restart from the keyboard
  await page.getByRole('button', { name: 'Back' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/step=10/)
  await tabTo(page, 'Restart')
  await page.keyboard.press('Enter')
  await expect(cap).toContainText('17%')

  // Arrow-key shortcuts work when focus is not on a control
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(/step=2/)
  await page.keyboard.press('ArrowLeft')
  await expect(page).toHaveURL(/step=1/)
})

test('demo: step 1 is a demo panel, not a second copy of the landing page', async ({ page }) => {
  await page.goto('/#/demo')
  const stage = page.getByTestId('demo-stage')
  await expect(stage).toContainText('RTOs per 1 lakh orders')
  await expect(stage.getByRole('link', { name: /Play the demo/ })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Verify it yourself' })).toHaveCount(0)
})

test('demo: interacting with the embedded surface pauses the tour', async ({ page }) => {
  await page.goto('/#/demo?step=2')
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await page.getByTestId('demo-stage').getByRole('button', { name: 'Yes, deliver' }).click()
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  await expect(page.getByTestId('demo-status')).toContainText('Paused while you explore')
  const url = page.url()
  await page.waitForTimeout(13_000) // longer than the step's 13 s timer
  expect(page.url()).toBe(url)
})

test('keyboard: every surface is reachable from the nav, with a visible focus ring', async ({ page }) => {
  await page.goto('/#/')
  for (const name of ['Customer', 'Rider', 'Hub', 'Resale', 'Impact', 'Pilot', '▶ Demo']) {
    await tabTo(page, name)
  }
})

test('reduced motion is honoured', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/')
  const m = await page.evaluate(() => ({
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
    rise: [...document.querySelectorAll('.animate-rise')].map((e) => parseFloat(getComputedStyle(e).animationDuration)),
  }))
  expect(m.scroll).toBe('auto')
  expect(m.rise.length).toBeGreaterThan(0)
  for (const d of m.rise) expect(d).toBeLessThan(0.001)

  // framer-motion (MotionConfig reducedMotion="user"): new chat bubbles appear without sliding in
  await page.goto('/#/customer')
  await page.getByRole('button', { name: 'Yes, deliver' }).click()
  // Two frames later: with reduced motion the bubble is already in place; a slide-in would still be moving
  await page.waitForTimeout(100)
  const t = await page.evaluate(() => {
    const bubbles = [...document.querySelectorAll('figure [class*="rounded-xl"][class*="shadow-sm"]')]
    return getComputedStyle(bubbles[bubbles.length - 1]).transform
  })
  expect(t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)', `bubble transform: ${t}`).toBe(true)
})
