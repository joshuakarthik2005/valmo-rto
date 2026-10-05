import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

const errors: string[] = []

test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
})

test.afterEach(async () => {
  expect(errors, 'console errors').toEqual([])
})

async function shot(page: Page, name: string, project: string) {
  // Full-page captures start from the top so the sticky header is drawn once, in place
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
  await page.screenshot({ path: `docs/screens/${project}-${name}.jpg`, type: 'jpeg', quality: 72, fullPage: project !== 'tablet' })
}

test('landing: judge path, badge and verify card', async ({ page }, info) => {
  await page.goto('/#/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('before')
  await expect(page.getByText('Prototype: simulated data').first()).toBeVisible()
  await expect(page.getByText('github.com/joshuakarthik2005/valmo-rto').first()).toBeVisible()
  await expect(page.getByText('₹20.4L').first()).toBeVisible()
  await expect(page.getByText(/₹5\.4L to ₹11\.4L/)).toBeVisible()
  await shot(page, '01-landing', info.project.name)
})

test('customer: ladder escalation and every reply value', async ({ page }, info) => {
  await page.goto('/#/customer')
  const esc = page.getByTestId('no-reply')
  for (let k = 0; k < 3; k++) await esc.click()
  await expect(esc).toBeDisabled()
  await expect(page.getByText(/will call you before dispatch/)).toBeVisible()
  await shot(page, '02-customer-escalated', info.project.name)

  const restart = page.getByRole('button', { name: 'Restart' })
  const value = page.getByTestId('reply-value')

  await restart.click()
  await page.getByRole('button', { name: 'Yes, deliver' }).click()
  await expect(value).toHaveText('₹0')
  await page.getByRole('button', { name: /Pay ₹\d+ by UPI/ }).click()
  await expect(value).toContainText('₹18')
  await expect(page.getByText('−₹2').first()).toBeVisible()

  await restart.click()
  await page.getByRole('button', { name: 'Cancel order' }).click()
  await expect(value).toHaveText('up to ₹170')

  await restart.click()
  await page.getByRole('button', { name: "I didn't order this" }).click()
  await expect(value).toHaveText('up to ₹170')
  await expect(page.getByText('Fraud caught', { exact: true })).toBeVisible()

  await restart.click()
  await page.getByRole('button', { name: 'Change time' }).click()
  await page.getByRole('button', { name: 'Fri, 2–6 PM' }).click()
  await expect(page.getByText(/now arrives Fri, 2–6 PM/)).toBeVisible()

  await page.getByRole('radio', { name: 'Hinglish' }).click()
  await expect(page.getByText(/Needs native review/)).toBeVisible()
  await page.getByRole('radio', { name: 'In-app order' }).click()
  await expect(page.getByText('My order')).toBeVisible()
  await shot(page, '03-customer-app-hinglish', info.project.name)
})

test('rider: masked-call validation and OTP delivery', async ({ page }, info) => {
  await page.goto('/#/rider')
  await page.getByTestId('mark-unavailable').click()
  await expect(page.getByRole('alert')).toContainText('Auto-rejected')
  await page.getByRole('button', { name: /Call customer/ }).click()
  await page.getByRole('button', { name: 'No answer' }).click()
  await expect(page.getByText(/placed · not answered/)).toBeVisible()
  await page.getByTestId('mark-unavailable').click()
  await expect(page.getByRole('status').filter({ hasText: 'Verified attempt' })).toBeVisible()
  await expect(page.getByText(/Attempt fee protected: ₹15/)).toBeVisible()
  await shot(page, '04-rider-verified', info.project.name)

  await page.getByRole('button', { name: /MSH-48590/ }).click()
  await page.getByRole('button', { name: 'Delivered (OTP)' }).click()
  await page.getByLabel("Customer's delivery OTP").fill('4321')
  await page.getByRole('button', { name: 'Confirm delivery' }).click()
  await expect(page.getByText('Delivered, OTP matched')).toBeVisible()
  await expect(page.getByText(/High-risk premium earned: ₹5/)).toBeVisible()
})

test('hub: control tower, review queue and resale shelf', async ({ page }, info) => {
  await page.goto('/#/hub')
  await expect(page.getByRole('heading', { name: 'Orders before dispatch' })).toBeVisible()
  await page.getByRole('button', { name: 'Uphold' }).first().click()
  await expect(page.getByText(/Rejection upheld/)).toBeVisible()
  await expect(page.getByText('Window closed')).toBeVisible()
  await shot(page, '05-hub', info.project.name)
})

test('resale: eligibility to next-day delivery', async ({ page }, info) => {
  await page.goto('/#/resale')
  await expect(page.getByText('₹74')).toBeVisible()
  const next = page.getByRole('button', { name: 'Next step' })
  await next.click()
  await expect(page.getByText('Eligible for local resale.')).toBeVisible()
  await next.click()
  await expect(page.getByText(/Same device as original buyer: blocked/)).toBeVisible()
  await next.click()
  await expect(page.getByText(/The hub only prints it/)).toBeVisible()
  await expect(page.getByText(/GST treatment/)).toBeVisible()
  await next.click()
  await expect(page.getByText(/45-day return policy/)).toBeVisible()
  await shot(page, '06-resale', info.project.name)
})

test('impact: deck values, toggles, shareable URL, drawer', async ({ page }, info) => {
  await page.goto('/#/impact')
  const net = page.getByTestId('net')
  await expect(net).toHaveText('₹5.4L')
  await expect(page.getByText(/26% of the ₹20\.4L/)).toBeVisible()
  await expect(page.getByText('Upper-bound illustration, not a forecast')).toBeVisible()
  await shot(page, '07-impact', info.project.name)

  await page.getByRole('radio', { name: 'Ceiling (illustrative)' }).click()
  await expect(net).toHaveText('₹11.4L')
  await page.getByRole('radio', { name: 'Move 2 standalone' }).click()
  await expect(page.getByText(/Standalone Move 2/)).toBeVisible()

  await page.locator('#s-m2Match').fill('0.35')
  await expect(page).toHaveURL(/m2Match=0\.35/)
  const url = page.url()
  await page.goto('about:blank')
  await page.goto(url)
  await expect(page.getByTestId('net')).not.toHaveText('₹5.4L')
  await expect(page.locator('#s-m2Match')).toHaveValue('0.35')

  await page.getByRole('button', { name: /^Assumptions/ }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByText('Case data pack').first()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('pilot: 20 + 20 design, generated headline, pincodes beat weeks, guardrails', async ({ page }, info) => {
  await page.goto('/#/pilot')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('20 highest-RTO pincodes against 20 matched controls')
  const head = page.getByTestId('pilot-headline')
  await expect(head).toContainText('With 20 treated and 20 control pincodes, 50 orders per pincode per week for 13 weeks, and an ICC of 0.02')
  await expect(head).toContainText('detect a drop of about 4.6 points')
  await expect(head).toContainText('The 3.4-point target is smaller than that, so detecting it would take about 38 pincodes per arm')
  // One target at a time: the 3-point comparison lives in the box, not the headline
  await expect(head).not.toContainText('3-point')
  const box = page.getByTestId('pins-box')
  await expect(box).toContainText('a 3-point shift is out of reach')
  await expect(box).toContainText('27 per arm at ICC 0.01 and 118 at ICC 0.05')
  await expect(page.getByTestId('n-unclustered')).toHaveText('1,759')
  await expect(page.getByTestId('mde')).toHaveText('4.6 pts')
  await expect(page.getByTestId('weeks-needed')).toHaveText('Never')
  await expect(page.getByTestId('pins-for-3')).toHaveText('50')
  const icc = page.getByTestId('mde-by-icc')
  for (const t of ['1.3 pts', '3.4 pts', '4.6 pts', '6.9 pts', '27', '118']) await expect(icc).toContainText(t)
  const pw = page.getByTestId('pincodes-vs-weeks')
  await expect(pw).toContainText('4.5 pts')
  await expect(pw).toContainText('3.3 pts')
  // The headline follows the inputs: with no clustering, 3 points is within reach
  await page.locator('#pc-icc').fill('0')
  await expect(page.getByTestId('weeks-needed')).toHaveText('2')
  await expect(page.getByTestId('mde')).toHaveText('1.3 pts')
  await expect(head).toContainText('The 3.4-point target is within reach')
  await expect(page.getByTestId('pins-box')).toContainText('already covers a 3-point shift')
  await expect(head).toContainText('and an ICC of 0,')
  await page.getByRole('button', { name: 'Reset to the planned design' }).click()
  await expect(page.getByTestId('mde')).toHaveText('4.6 pts')
  await expect(page.getByText(/power to detect 3/i)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Guardrails' })).toBeVisible()
  await shot(page, '08-pilot', info.project.name)
})

test('demo: captions with pause, skip and restart', async ({ page }, info) => {
  await page.goto('/#/demo')
  const cap = page.getByTestId('caption')
  await expect(cap).toContainText('17%')
  await page.getByRole('button', { name: 'Pause' }).click()
  await page.getByRole('button', { name: 'Skip' }).click()
  await expect(cap).toContainText('T-48h')
  await expect(page).toHaveURL(/step=2/)
  await page.getByRole('button', { name: 'Restart', exact: true }).first().click()
  await expect(cap).toContainText('17%')
  await page.goto('/#/demo?step=9')
  await expect(cap).toContainText('₹5.4L')
  await page.goto('/#/demo?step=10')
  await expect(cap).toContainText('about 4.6 points')
  await expect(cap).toContainText('about 50 pincodes per arm')
  await shot(page, '09-demo', info.project.name)
})

test('keyboard: skip link and surface nav', async ({ page }) => {
  await page.goto('/#/')
  await page.keyboard.press('Tab')
  await expect(page.getByText('Skip to content')).toBeFocused()
  await page.keyboard.press('Tab') // wordmark
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Customer', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/customer/)
})

test('legacy prototype is preserved, archived and not indexed', async ({ page }) => {
  errors.length = 0
  await page.goto('/legacy/')
  await expect(page).toHaveTitle(/Route Cause/)
  const banner = page.getByTestId('legacy-banner')
  await expect(banner).toBeVisible()
  await expect(banner).toContainText('Archived v1, superseded')
  await expect(banner.getByRole('link', { name: /current prototype/ })).toHaveAttribute('href', '/')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})

test('header: "Route Cause prototype" tag beside the wordmark at every width', async ({ page }) => {
  await page.goto('/#/')
  const tag = page.getByTestId('prototype-tag')
  await expect(tag).toBeVisible()
  await expect(tag).toHaveText('Route Cause prototype')
  const [w, t] = await Promise.all([page.locator('header a[href="#/"]').boundingBox(), tag.boundingBox()])
  expect(t!.x + t!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  expect(Math.abs((t!.y + t!.height / 2) - (w!.y + w!.height / 2))).toBeLessThan(12)
})

test('verify card: one phone QR on large screens, wrapping repo link, four buttons', async ({ page }, info) => {
  for (const route of ['/', '/customer']) {
    await page.goto(`/#${route}`)
    const card = page.getByTestId('verify-card').first()
    await expect(card.getByRole('heading', { name: 'Verify it yourself' })).toBeVisible()
    const repo = card.getByRole('link', { name: 'github.com/joshuakarthik2005/valmo-rto' })
    await expect(repo).toHaveAttribute('href', 'https://github.com/joshuakarthik2005/valmo-rto')
    expect(await repo.locator('wbr').count()).toBe(2)
    for (const name of ['Code', 'Tests', 'Replay', 'Design boards']) {
      await expect(card.getByRole('link', { name, exact: true })).toBeVisible()
    }
    // Only one QR on the card, and only from 1024 px up
    await expect(card.locator('svg')).toHaveCount(1)
    const qr = card.getByTestId('phone-qr')
    const wide = (page.viewportSize()?.width ?? 0) >= 1024
    if (wide) {
      await expect(qr).toBeVisible()
      await expect(qr).toContainText('Try it on your phone')
      await expect(card.getByRole('img', { name: 'QR code for valmo-jet.vercel.app' })).toBeVisible()
    } else {
      await expect(qr).toBeHidden()
    }
  }
  // Squeeze the link: every line except the last must end with "/" (never mid-word, never at the hyphen)
  for (const w of [260, 200, 140]) {
    const lines = await page.getByTestId('verify-card').first().getByTestId('repo-link').evaluate((a, w) => {
      ;(a.parentElement as HTMLElement).style.width = `${w}px`
      const r = document.createRange()
      const rows: Record<number, string> = {}
      const walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT)
      let n: Node | null
      while ((n = walker.nextNode())) {
        const t = n as Text
        for (let i = 0; i < t.length; i++) { r.setStart(t, i); r.setEnd(t, i + 1); const top = Math.round(r.getBoundingClientRect().top); rows[top] = (rows[top] ?? '') + t.data[i] }
      }
      return Object.values(rows)
    }, w)
    expect(lines.join('')).toBe('github.com/joshuakarthik2005/valmo-rto')
    for (const l of lines.slice(0, -1)) expect(l.endsWith('/')).toBe(true)
  }
  await page.reload()
  await shot(page, '10-verify-card', info.project.name)
})

test('layout: every surface link visible and no sideways page scroll on any route', async ({ page }) => {
  for (const r of ['/', '/customer', '/rider', '/hub', '/resale', '/impact', '/pilot', '/demo']) {
    await page.goto(`/#${r}`)
    await expect(page.locator('h1').first()).toBeVisible()
    const m = await page.evaluate(() => {
      const links = [...document.querySelectorAll('nav[aria-label="Surfaces"] a')]
      const hidden = links.filter((a) => { const b = a.getBoundingClientRect(); return b.left < 0 || b.right > innerWidth + 0.5 }).map((a) => a.textContent)
      return { count: links.length, hidden, overflow: document.documentElement.scrollWidth - innerWidth }
    })
    expect(m.count, r).toBe(7)
    expect(m.hidden, `nav links outside the viewport on ${r}`).toEqual([])
    expect(m.overflow, `horizontal page overflow on ${r}`).toBeLessThanOrEqual(0)
  }
})

test('hub: orders show risk, nudge and timer without sideways scrolling', async ({ page }) => {
  await page.goto('/#/hub')
  const narrow = (page.viewportSize()?.width ?? 0) < 768
  const view = page.getByTestId(narrow ? 'orders-cards' : 'orders-table')
  await expect(view).toBeVisible()
  await expect(page.getByTestId(narrow ? 'orders-table' : 'orders-cards')).toBeHidden()
  for (const t of ['MSH-48702', 'High · 25.9%', 'Hub to call', 'Not dispatching']) await expect(view).toContainText(t)
  const fits = await view.evaluate((el) => {
    const box = el.getBoundingClientRect()
    const scroller = el.matches('[data-testid="orders-table"]') ? el : null
    return box.right <= innerWidth + 0.5 && (!scroller || scroller.scrollWidth <= scroller.clientWidth)
  })
  expect(fits).toBe(true)
})
