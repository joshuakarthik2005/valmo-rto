# 0001: Static single-page app with hash routing, no backend

**Status:** accepted

**Context.** The prototype is judged from a link, often on a phone, and it has to stay up with no running costs or operations. It shows simulated data only. Nothing it does needs a server: no accounts, no persistence, no live integrations.

**Decision.** Build a static Vite + React + TypeScript app, deployed on Vercel, with hash routing (`#/customer`, `#/impact?…`). There is no backend, no database and no environment secrets. Shareable state, such as an Impact scenario or a demo step, lives in the URL.

**Consequences.**
- Any route deep-links and reloads without server rewrites, and preview deploys are free.
- The app makes no network requests after load, which keeps Lighthouse and the e2e suite stable.
- Nothing can be "live": every number is simulated or computed, and the UI says so on every screen.
- Hash URLs are less tidy than path URLs, which is acceptable for a prototype.
