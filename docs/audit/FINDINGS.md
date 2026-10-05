# Judge-eyes audit (production, 5 Oct 2026)

This audit walks https://valmo-jet.vercel.app (PR #3 build) at 360, 768 and 1440 px, read as a Meesho or Valmo evaluator with five minutes. The screenshots in this folder are named `<width>-<route>.jpg`.

Each finding is mapped to the v3 item that fixes it, and the Status column shows whether it's done (with the PR number) or still planned. "Small fix" means copy or layout only, bundled into the PR named.

## Overclaims, and numbers that don't reconcile with the model

| # | Where | Finding | Fix in | Status |
|---|---|---|---|---|
| F1 | `#/pilot` | The heading "Statistical sizing" sits on an asserted threshold (≥ 50 orders per pincode per week) with no power calculation behind it. Once orders are clustered by pincode, the planned design cannot detect a shift of about 3 points (see A1). This is the most attackable claim on the site. | **A1** | ✅ fixed in #6 (A1) |
| F2 | `#/pilot` | The page draws 20 treatment and 20 control pincodes (40 in total). The v3 brief's planned design is 10 per arm (20 in total). One of them disagrees with the deck. **Needs your confirmation.** | **A1** | ✅ fixed in #6 (A1): 20 treated + 20 control (control size assumed) |
| F3 | `#/pilot` | The "simulated readout" shows invented values (46% response, 12% rejection, 0.8% opt-out, RTO 13.9% against 16.7%) laid out like results. They are labelled simulated, but they read as outcomes. | **A1**: replace them with the metric definitions and the minimum detectable effect, and show synthetic values only as clearly marked examples | ✅ fixed in #6 (A1) |
| F4 | `#/hub`, `#/rider` | The risk shows as "High · 25.9%", which looks precise but comes from an ad-hoc formula with no explanation. | **A5** | planned (A5) |
| F5 | `#/impact` | The root-cause chart says "n=20 shopper survey", but its source pill says "Primary research (n=25, small)". The two sample sizes look inconsistent; the 20 shoppers are a subset of the 25 interviews. | Small fix in **A5** | planned (A5) |
| F6 | `/legacy/`, linked from the README | The preserved v1 page still uses the old ₹170 basis for the UPI switch (₹26 expected). That contradicts the corrected ₹18 everywhere else, and a judge who clicks through will see both. | **A6**: add a "superseded" banner to legacy and correct the README link text | ✅ fixed in the polish PR |
| F7 | `#/rider` | The masked number "+91 80 4213 7130 (masked)" looks like a real dialable number. | Small fix in **A4**: use an obviously fake proxy format | planned (A4) |

## Confusing, unfinished, or dead ends

| # | Where | Finding | Fix in | Status |
|---|---|---|---|---|
| F8 | All pages, 360 px | The surface switcher cuts off "Impact", "Pilot" and "▶ Demo" with nothing to show it scrolls. The two highest-value pages are invisible on a phone. | **A7** | ✅ fixed in #8 |
| F9 | `#/hub`, 360 px | The orders table scrolls sideways. Risk, nudge status and the SLA timer, which are the point of the page, start off-screen. | **A7**: card layout below `sm` | ✅ fixed in #8 |
| F10 | `#/demo`, step 1 | The demo embeds the landing page, so a second "Play the demo" button and a second Verify card appear inside it. | **A7**: demo-specific intro panel | planned (A7) |
| F11 | `#/demo` | The timer keeps advancing while a judge interacts with the embedded surface, so the step changes under their cursor. | **A7**: pause on interaction | planned (A7) |
| F12 | `#/resale` | The buyer's "Buy now" button does nothing. The seller's opt-in checkbox has no effect. | **A4** covers "resale buyer cancels" and the buyer path. **B2** covers the seller view | planned (A4, B2) |
| F13 | `#/hub` | "Override" on a flagged mark only changes a line of text, and the decision isn't reflected anywhere else. | **A4** | planned (A4) |
| F14 | Header | The "Meesho × Valmo" wordmark could be read as official co-branding. The disclaimer is only in the footer. | Your call. Option: add "Team prototype" next to the wordmark | ✅ fixed in the polish PR |

## Missing pieces an evaluator will ask about

| # | Question | Fix in | Status |
|---|---|---|---|
| F15 | "How does this plug into Valmo's systems? What data do you need?" | **A3** | planned (A3) |
| F16 | "How confident are these ranges?" The only answer today is conservative versus ceiling. | **A2** | planned (A2) |
| F17 | "What happens when the IVR fails, or the rider is offline?" | **A4** | planned (A4) |
| F18 | "Is the risk score real?" | **A5** | planned (A5) |
| F19 | "Do the tests actually run?" There is no CI badge or automated checks. | **A6** | planned (A6) |

## Performance

| # | Finding | Fix in | Status |
|---|---|---|---|
| F20 | `#/pilot` Lighthouse Performance is bimodal (78–99). Recharts (about 113 KB) is loaded for a single line chart. | **A1**: lightweight SVG chart, keeping Recharts out of the pilot route | ✅ fixed in #6 (A1): Recharts removed |

## What already holds up

- Every rupee figure on `#/impact` matches `model.ts`, and an e2e test asserts this on production.
- The per-case ₹170 ceilings are never added to the Move 1 total.
- UPI is shown honestly as −₹2 net at ₹20.
- The ₹410–870 Cr network figure is clearly marked as an upper bound.
- CLS is 0, there are no console errors, and Accessibility, Best Practices and SEO are 100 on every route.

## Tier B proposals (waiting for your go)

- **B1, Rider PWA with an offline queue.** Make `#/rider` installable (manifest plus service worker, cached app shell). Attempt marks and call-log entries are queued in IndexedDB while offline and replayed in order when the connection returns. Validation still runs on the server's view of the call log, so an offline mark is "pending" until it syncs. Tests: Playwright offline mode queues marks, and they replay in order. Risk: a service worker on the main origin can serve stale assets after a deploy, so it gets a versioned cache and skip-waiting with a "new version" toast.
- **B2, Seller view.** Per-seller resale outcomes (resold, reverted, pending), payout status (normal settlement), the effect of opting in (return-leg charges avoided, computed with `model.ts`), and listing-accuracy feedback that turns "product mismatch" refusals into a prompt to fix the listing. All synthetic, from scenario data.
- **B3, Compliance flags.** A page listing the questions without answering them: WhatsApp Business opt-in and template-category rules, consent and notice for recorded or masked calls, and India's Digital Personal Data Protection Act, 2023 and its Rules (notice, consent, purpose limitation, retention). Each links to the current primary source, is marked "flagged for legal review", and draws no legal conclusions.
