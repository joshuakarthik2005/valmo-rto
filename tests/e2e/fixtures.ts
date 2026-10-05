import { test as base, expect } from '@playwright/test'

/**
 * Shared test fixture. For protected Vercel previews it sends the short-lived dev OIDC token
 * (from `vercel env pull .env.local`) only to the deployment's own origin, never to third parties.
 * Against localhost or the public production URL without a token it does nothing.
 */
export const test = base.extend({
  page: async ({ page, baseURL }, use, testInfo) => {
    // Diagnostics: if a test fails, report every request still in flight (what a load wait would block on)
    const inflight = new Map<object, string>()
    const t0 = Date.now()
    page.on('request', (r) => inflight.set(r, `${r.resourceType()} ${r.url()} (+${Date.now() - t0}ms)`))
    page.on('requestfinished', (r) => inflight.delete(r))
    page.on('requestfailed', (r) => inflight.set(r, `FAILED ${r.url()} ${r.failure()?.errorText ?? ''}`))
    const token = process.env.VERCEL_OIDC_TOKEN
    if (token && baseURL && !baseURL.includes('localhost')) {
      const origin = new URL(baseURL).origin
      await page.route((u) => u.origin === origin, (route) =>
        route.continue({ headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': token } }))
    }
    // Every test also fails on any Content-Security-Policy violation (enforced or report-only),
    // so interactive states (drawers, toggles, sliders, demo steps) are covered, not just page loads.
    await page.addInitScript(() => {
      const w = window as unknown as { __csp?: string[] }
      w.__csp = []
      document.addEventListener('securitypolicyviolation', (e) => {
        w.__csp!.push(`${e.disposition} ${e.effectiveDirective} ${e.blockedURI} @ ${location.pathname}${location.hash}`)
      })
    })
    await use(page)
    if (!page.isClosed()) {
      const csp = await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []).catch(() => [] as string[])
      if (testInfo.status === testInfo.expectedStatus) {
        expect(csp, 'CSP violations during this test').toEqual([])
      }
    }
    if (testInfo.status !== testInfo.expectedStatus) {
      const list = [...inflight.values()]
      const NL = String.fromCharCode(10)
      await testInfo.attach('inflight-requests', { body: list.join(NL) || '(none)', contentType: 'text/plain' })
      console.log(`[diag] ${testInfo.title} [${testInfo.project.name}] in flight at failure: ${list.join(' | ') || '(none)'}`)
    }
  },
})

export { expect }
