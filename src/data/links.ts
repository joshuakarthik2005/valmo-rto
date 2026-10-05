/**
 * Every URL used by the app, the QR codes and the docs. Change them here only:
 * the QR generator (scripts/gen-qr.mjs) and the printed text both read this file.
 */
export const LINKS = {
  repo: 'https://github.com/joshuakarthik2005/valmo-rto',
  repoDisplay: 'github.com/joshuakarthik2005/valmo-rto',
  live: 'https://valmo-jet.vercel.app',
  liveDisplay: 'valmo-jet.vercel.app',
  tests: 'https://github.com/joshuakarthik2005/valmo-rto/blob/main/docs/tests.md',
  designBoards: 'https://github.com/joshuakarthik2005/valmo-rto/tree/main/docs/design',
  replay: '#/demo',
} as const
