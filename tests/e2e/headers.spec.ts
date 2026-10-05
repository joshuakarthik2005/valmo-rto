import { test, expect } from './fixtures'

// Security headers come from vercel.json, so they exist only on Vercel deployments (preview or production),
// not on the local `vite preview` server. These tests skip locally.
const ROUTES = ['/', '/customer', '/rider', '/hub', '/resale', '/impact', '/pilot', '/demo']

function authHeaders(): Record<string, string> {
  const t = process.env.VERCEL_OIDC_TOKEN
  return t ? { 'x-vercel-trusted-oidc-idp-token': t } : {}
}

test.describe('security headers (deployed only)', () => {
  test.skip(({ baseURL }) => !baseURL || baseURL.includes('localhost'), 'headers are set by Vercel, not by vite preview')

  test('app pages send the baseline headers and a CSP', async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/`, { headers: authHeaders() })
    const h = res.headers()
    expect(h['x-content-type-options']).toBe('nosniff')
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(h['permissions-policy']).toContain('camera=()')
    expect(h['cross-origin-opener-policy']).toBe('same-origin')
    const csp = h['content-security-policy'] ?? h['content-security-policy-report-only']
    expect(csp, 'a CSP header (enforced or report-only)').toBeTruthy()
    expect(csp).toContain("default-src 'self'")
    expect(csp).not.toContain("frame-ancestors 'none'")
    expect(h['x-frame-options']).toBeUndefined()
  })

  test('legacy page is noindex by header too', async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/legacy/`, { headers: authHeaders() })
    expect(res.headers()['x-robots-tag']).toContain('noindex')
  })
})

test('no CSP violations on any route', async ({ page, baseURL }) => {
  test.skip(!baseURL || baseURL.includes('localhost'), 'CSP is set by Vercel, not by vite preview')
  await page.addInitScript(() => {
    ;(window as unknown as { __csp: string[] }).__csp = []
    document.addEventListener('securitypolicyviolation', (e) => {
      ;(window as unknown as { __csp: string[] }).__csp.push(`${e.disposition} ${e.effectiveDirective} ${e.blockedURI}`)
    })
  })
  const found: string[] = []
  for (const r of ROUTES) {
    await page.goto(`/#${r}`)
    await expect(page.locator('h1').first()).toBeVisible()
    await page.waitForTimeout(300)
    const v = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)
    found.push(...v.map((x) => `${r}: ${x}`))
  }
  for (const r of ['/legacy/']) {
    await page.goto(r)
    await page.waitForTimeout(300)
    const v = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)
    found.push(...v.map((x) => `${r}: ${x}`))
  }
  expect(found).toEqual([])
})
