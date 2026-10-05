# Quality gates

Production (https://valmo-jet.vercel.app) serves the same build as a fresh `main` after PR #6, the A1 pilot power calculator (`main-BVgMOWAv.js`, `main-C2M0AJeg.css`). Earlier PRs added the self-hosted OFL fonts (#2) and the simplified Verify card (#3).

| Gate | Result | Evidence |
|---|---|---|
| Lighthouse mobile: Performance, Accessibility, Best Practices ≥ 90 | ✅ Accessibility, Best Practices and SEO are 100 everywhere. After A1, `#/pilot` scores 100 for Performance in both production runs (it was bimodal at 78–99 before) | Production table below; `scripts/lh.sh` (Lighthouse 12, mobile, simulated throttling) |
| Responsive at 360 / 768 / 1440 px | ✅ | `docs/screens/{mobile,tablet,desktop}-*.jpg` |
| Keyboard navigable | ✅ Skip link, surface nav, native buttons, inputs and sliders. Drawer closes on Esc and returns focus. Visible focus ring. Demo: Space and arrow keys | `tests/e2e/smoke.spec.ts` › keyboard |
| WCAG AA contrast | ✅ Lighthouse color-contrast audit passes on every route. Green text uses `#1F6B42` | Lighthouse Accessibility 100 |
| Zero console errors | ✅ Every e2e test fails on any console error. Lighthouse reports 0 console errors on every production run | Playwright and Lighthouse |
| All vitest tests pass | ✅ 57 passed, 0 skipped. These include the deck figures, pilot power (checked against independent Python values), and decoding `docs/qr-repo.png`, `docs/qr-live.png` and the in-app QR SVG | [tests.md](./tests.md) |
| Playwright smoke test clicks through every flow | ✅ 60/60 (smoke flows, per-route checks and Verify card × 3 viewports), locally, on the preview and on production | [tests.md](./tests.md) |
| Production URL verified in a fresh headless session | ✅ Every route loads with zero console errors, the Impact numbers equal the model's output, and the full smoke suite passes with no login | `tests/e2e/routes.spec.ts`, `BASE_URL=https://valmo-jet.vercel.app` |
| Layout stability (CLS) | ✅ 0 on every route in every production run, cold and warm, since the self-hosted fonts and calibrated fallbacks (PR #2) | Production table below |
| OG/Twitter meta and favicon | ✅ `og.png` (1200×630, numbers drawn from the model), `favicon.svg`/`.ico`, `apple-touch-icon.png` | `index.html` |

## Lighthouse mobile, public production (PR #3 build, 5 Oct 2026)

Self-hosted subset OFL fonts (Inter and Fraunces, about 29 KB each, preloaded, licences in `public/fonts/`) have no third-party font requests. A cold pass and then a warm pass were run from one machine.

| Route | Perf (cold) | Perf (warm) | Accessibility | Best Practices | SEO | CLS | Console errors |
|---|---|---|---|---|---|---|---|
| `#/` | 100 | 100 | 100 | 100 | 100 | 0 | 0 |
| `#/customer` | 99 | 99 | 100 | 100 | 100 | 0 | 0 |
| `#/rider` | 99 | 97 | 100 | 100 | 100 | 0 | 0 |
| `#/hub` | 99 | 97 | 100 | 100 | 100 | 0 | 0 |
| `#/resale` | 94 | 89 | 100 | 100 | 100 | 0 | 0 |
| `#/impact` | 95 | 97 | 100 | 100 | 100 | 0 | 0 |
| `#/pilot` | 94 → **100** | 79 → **100** | 100 | 100 | 100 | 0 | 0 |
| `#/demo` | 95 → **99** | 92 → **100** | 100 | 100 | 100 | 0 | 0 |

Re-runs: `#/resale` scored 91, 100 and 94.

Values after an arrow are the post-A1 production runs (PR #6 build). Only `#/pilot` and `#/demo` were re-measured. The other rows are from the PR #3 build, and A1 didn't touch those routes.

**Fixed in A1: `#/pilot` performance.** The page used to load Recharts (about 113 KB) for one line chart, and scored 78–99 depending on the test machine's CPU load. A1 removed the synthetic chart and the dependency. `#/pilot` now scores 100 in two production runs (and 97–100 on the preview).

Earlier, on the PR #1 build with Google Fonts, cold runs scored down to 77, and `#/impact` showed a font-swap shift (CLS 0.154). Both are gone now.

## Lighthouse, local production build (`vite preview`, PR #1 era)

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


## E2E stability (6 Oct 2026)

- **What happened:** three single-test timeouts showed up over earlier full runs (`#/resale` on the preview twice and `#/` on production once). Each was a one-minute hang in the `networkidle` wait.
- **Isolated loads:**
  - `#/resale` loaded 20 times each at 360, 768 and 1440 px on production, plus `#/` 20 times at 1440 px: 80 loads, 0 stalls, and nothing left in flight after load.
  - The `#/resale` Playwright tests (3 tests matching "resale") ran 20 times each at 360 and 768 px, locally and on production: 240 runs, 240 passed.
- **Full suite:** 5 runs against production, 300 tests, 300 passed.
- **Diagnosis:** no page-level cause was found. The app makes no requests after load: no polling, no long-lived connections. The hangs only happened during heavy parallel runs on the test machine.
- **Diagnostic added:** `tests/e2e/fixtures.ts` now records every in-flight request and attaches the list to any failing test, so a future stall shows exactly what it was waiting on.
