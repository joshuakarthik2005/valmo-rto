// Per-route JavaScript budget, enforced in CI after `npm run build`.
// For each route, it sums the gzipped size of the entry chunk (index.html) plus the route's lazy chunk and
// everything that chunk statically imports, i.e. the JS a first visit to that route downloads.
//   node scripts/js-budget.mjs            -> prints the table, exits 1 if any route is over budget
import { readFileSync, readdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join, basename } from 'node:path'

// Budget per route, gzipped KB: about 15% headroom over the largest route at the time it was set (105 KB). Raise it only deliberately.
const BUDGET_KB = 120

const dir = 'dist/assets'
const files = readdirSync(dir).filter((f) => f.endsWith('.js'))
const gz = (f) => gzipSync(readFileSync(join(dir, f))).length
const importsOf = (f) => {
  const src = readFileSync(join(dir, f), 'utf8')
  return [...src.matchAll(/(?:from|import)\s*["']\.\/([\w.-]+\.js)["']/g)].map((m) => m[1])
}
function closure(start) {
  const seen = new Set()
  const stack = [...start]
  while (stack.length) {
    const f = stack.pop()
    if (seen.has(f) || !files.includes(f)) continue
    seen.add(f)
    stack.push(...importsOf(f))
  }
  return seen
}

const html = readFileSync('dist/index.html', 'utf8')
const entry = [...html.matchAll(/(?:src|href)="\/assets\/([\w.-]+\.js)"/g)].map((m) => m[1])
const base = closure(entry)
// framer-motion's MotionBoundary loads with every surface route (see App.tsx)
const motion = files.filter((f) => basename(f).startsWith('MotionBoundary-'))

const routes = { '/': [], '/customer': ['Customer'], '/rider': ['Rider'], '/hub': ['Hub'], '/resale': ['Resale'], '/impact': ['Impact'], '/pilot': ['Pilot'], '/demo': ['Demo'], '/architecture': ['Architecture'], '/scenarios': ['Scenarios'] }
let failed = false
const rows = []
for (const [route, prefixes] of Object.entries(routes)) {
  const chunks = files.filter((f) => prefixes.some((p) => basename(f).startsWith(`${p}-`)))
  if (prefixes.length && chunks.length === 0) { console.error(`No chunk found for ${route}`); failed = true; continue }
  const all = closure([...base, ...chunks, ...(prefixes.length ? motion : [])])
  const kb = [...all].reduce((s, f) => s + gz(f), 0) / 1024
  const over = kb > BUDGET_KB
  failed ||= over
  rows.push({ route, kb, over })
}
for (const r of rows) console.log(`${r.route.padEnd(14)} ${r.kb.toFixed(1).padStart(6)} KB gz  ${r.over ? `OVER (budget ${BUDGET_KB} KB)` : 'ok'}`)
console.log(`Budget: ${BUDGET_KB} KB gzipped JS per route (first visit).`)
process.exit(failed ? 1 : 0)
