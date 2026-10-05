# Route Cause: reducing RTO for Valmo

An interactive prototype for **Meesho DICE Challenge S3 (Business Track): "Reducing RTO: Getting More Orders Delivered"**.

- Live: https://valmo-jet.vercel.app
- Guided replay: https://valmo-jet.vercel.app/#/demo
- 90-second walkthrough: [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)
- Test results: [docs/tests.md](docs/tests.md)
- Design boards: [docs/design](docs/design)
- The original v1 prototype is preserved at [`/legacy/`](legacy/index.html)

> **Disclaimer.** This is a student team prototype and all data in it is simulated. It is not a Meesho or Valmo product, uses no official logo assets, and implies no integration with either company's systems. Customer, rider and seller names are fictional. Ceiling figures are illustrative, and the network-scale figure is an upper-bound illustration, not a forecast. Non-English message copy needs native-speaker review.

## What it shows

| Surface | Route | Idea |
|---|---|---|
| Customer | `#/customer` | Reconfirmation ladder: T-48h WhatsApp/SMS, T-24h delivery window, T-2h IVR, then a hub call before dispatch. Replies: confirm, reschedule, cancel, "I didn't order this", switch COD to UPI. English, Hinglish and Hindi. |
| Rider | `#/rider` | Masked in-app calls and a call log validate "customer unavailable". No GPS. OTP only confirms a successful delivery. |
| Hub | `#/hub` | Control tower: risk, nudge status, SLA timers, flagged attempt marks, resale shelf countdown. |
| Resale | `#/resale` | Refused parcel, eligibility check, nearby buyer match, auto invoice, next-day local delivery, or standard RTO after 5 business days. |
| Impact | `#/impact` | Live waterfall, sliders, assumptions drawer with source tags, sensitivity, RTO gauge, shareable URL. |
| Pilot | `#/pilot` | 20 pincodes against a matched control, 30-60-90 timeline, named metrics and guardrails (all simulated). |

## Single source of truth

- `src/data/assumptions.ts` holds every input number, each tagged *Case data pack*, *Primary research (n=25, small)* or *Assumption*.
- `src/lib/model.ts` holds all the arithmetic as pure functions. Components only format what the model returns.
- `src/lib/model.test.ts` asserts the exact figures in the submitted deck (17,000 RTOs, ₹20.4L true drag, ₹2.88L / ₹10.02L Move 1, ₹74 per resold parcel, ₹5.4L–₹11.4L combined, and so on).
- `src/data/links.ts` holds every URL. The QR codes are generated from it at build time, and a test decodes them back.

## Run, build, test

Requires Node 20 or later.

```bash
npm ci
npm run dev            # http://localhost:5173
npm run build          # QR codes, then type-check, then the static build in dist/
npm test               # vitest: model and QR decode tests
npm run test:e2e       # Playwright smoke test; uses your installed Chrome
npm run docs:tests -- --e2e   # regenerates docs/tests.md and docs/screens
node scripts/gen-qr.mjs --png # writes docs/qr-repo.png and docs/qr-live.png
```

Playwright uses `channel: 'chrome'`, so no browser download is needed. To test a deployed URL, run `BASE_URL=https://… npx playwright test`.

## Deploy

This is a static Vite build with hash routing, so no rewrites are needed. `vercel.json` sets the Vite framework, `npm run build` and the `dist` output.

```bash
vercel deploy          # preview
vercel deploy --prod   # production. Only after the PR is merged and every quality gate passes.
```

## Stack

Vite, React 18, TypeScript, Tailwind CSS, framer-motion, Recharts, vitest, Playwright, qrcode and jsqr.
