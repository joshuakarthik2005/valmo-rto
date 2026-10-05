# Quality gates

v2 has been live on https://valmo-jet.vercel.app since PR #1 (5 Oct 2026). Production serves the same build as `main` (`main-CB5d8t3u.js`).

| Gate | Result | Evidence |
|---|---|---|
| Lighthouse mobile: Performance, Accessibility, Best Practices ≥ 90 | ✅ local production build, every route (table below) | `scripts/lh.sh` (Lighthouse 12, mobile, simulated throttling) |
| Same, on the Vercel preview | ⚠️ Accessibility 100 everywhere. Performance and Best Practices are understated: Deployment Protection adds about 1–2.5 s to the root document, and the auth header breaks the Google Fonts CORS preflight | Re-run on the public production URL after promotion |
| Responsive at 360 / 768 / 1440 px | ✅ | `docs/screens/{mobile,tablet,desktop}-*.jpg` |
| Keyboard navigable | ✅ Skip link, surface nav, native buttons, inputs and sliders. Drawer closes on Esc and returns focus. Visible focus ring. Demo: Space and arrow keys | `tests/e2e/smoke.spec.ts` › keyboard |
| WCAG AA contrast | ✅ Lighthouse color-contrast audit passes on every route. Green text uses `#1F6B42` | Lighthouse Accessibility 100 |
| Zero console errors | ✅ Every e2e test fails on any console error or page error | local and preview runs |
| All vitest tests pass | ✅ 49 passed, 0 skipped. Includes decoding `docs/qr-repo.png` and `docs/qr-live.png` | [tests.md](./tests.md) |
| Playwright smoke test clicks through every flow | ✅ 57/57 (smoke flows and per-route checks × 3 viewports), locally and on production | [tests.md](./tests.md) |
| Production URL verified in a fresh headless session | ✅ Every route loads with zero console errors, the Impact numbers equal the model's output, and the full smoke suite passes with no login | `tests/e2e/routes.spec.ts`, `BASE_URL=https://valmo-jet.vercel.app` |
| OG/Twitter meta and favicon | ✅ `og.png` (1200×630, numbers drawn from the model), `favicon.svg`/`.ico`, `apple-touch-icon.png` | `index.html` |

## Lighthouse, local production build (`vite preview`)

| Route | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `#/` | 100 | 100 | 100 | 100 |
| `#/customer` | 98 | 100 | 100 | 100 |
| `#/rider` | 98 | 100 | 100 | 100 |
| `#/hub` | 99 | 100 | 100 | 100 |
| `#/resale` | 97 | 100 | 100 | 100 |
| `#/impact` | 98 | 100 | 100 | 100 |
| `#/pilot` | 96 | 100 | 100 | 100 |
| `#/demo` | 99 | 100 | 100 | 100 |

## Lighthouse mobile, public production (PR #1 build, Google Fonts)

The first run hit a cold CDN and font cache. The second run is warm.

| Route | Perf (cold) | Perf (warm) | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|
| `#/` | 99 | – | 100 | 100 | 100 |
| `#/customer` | 77 | 98 | 100 | 100 | 100 |
| `#/rider` | 77 | 98 | 100 | 100 | 100 |
| `#/hub` | 99 | – | 100 | 100 | 100 |
| `#/resale` | 84 | 99 | 100 | 100 | 100 |
| `#/impact` | 81 | 95 | 100 | 100 | 100 |
| `#/pilot` | 96 | – | 100 | 100 | 100 |
| `#/demo` | 95 | – | 100 | 100 | 100 |

The cold runs showed a layout shift on `#/impact` from the Google web-font swap (CLS 0.154) and slow font round trips. Phase 5 self-hosts subset OFL fonts (Inter and Fraunces, about 29 KB each, preloaded, licences in `public/fonts/`) with metric-matched fallbacks, so the swap no longer moves the layout. Production needs re-measuring after that merges.
