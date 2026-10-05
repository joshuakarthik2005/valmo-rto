import { test as base, expect } from '@playwright/test'

/**
 * Shared test fixture. For protected Vercel previews it sends the short-lived dev OIDC token
 * (from `vercel env pull .env.local`) only to the deployment's own origin, never to third parties.
 * Against localhost or the public production URL without a token it does nothing.
 */
export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const token = process.env.VERCEL_OIDC_TOKEN
    if (token && baseURL && !baseURL.includes('localhost')) {
      const origin = new URL(baseURL).origin
      await page.route((u) => u.origin === origin, (route) =>
        route.continue({ headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': token } }))
    }
    await use(page)
  },
})

export { expect }
