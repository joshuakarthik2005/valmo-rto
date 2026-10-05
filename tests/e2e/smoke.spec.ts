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

test('pilot: sizing wording and guardrails', async ({ page }, info) => {
  await page.goto('/#/pilot')
  await expect(page.getByText(/50 orders per pincode per week, across the 90-day pilot/)).toBeVisible()
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

test('legacy prototype is preserved', async ({ page }) => {
  errors.length = 0
  await page.goto('/legacy/')
  await expect(page).toHaveTitle(/Route Cause/)
})
