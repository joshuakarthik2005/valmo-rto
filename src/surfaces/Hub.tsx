import { useEffect, useState } from 'react'
import { PageHeader, Stat } from '../components/ui'
import { ORDERS, FLAGGED, SHELF, HUB, DEMO_TODAY, type Nudge } from '../data/scenario'
import { orderRisk, addBusinessDays, businessDaysBetween, rupees, pctTrim, defaultInputs } from '../lib/model'

const inputs = defaultInputs()

const NUDGE: Record<Nudge, { label: string; cls: string }> = {
  'not-needed': { label: 'Not needed (prepaid)', cls: 'bg-cream-200 text-ink-soft' },
  sent: { label: 'T-48h nudge sent', cls: 'bg-plum-100 text-plum' },
  ivr: { label: 'T-2h IVR call', cls: 'bg-magenta-100 text-magenta-600' },
  'hub-call': { label: 'Hub to call', cls: 'bg-coral-100 text-plum' },
  confirmed: { label: 'Confirmed', cls: 'bg-leaf-100 text-leaf-700' },
  rescheduled: { label: 'Rescheduled', cls: 'bg-leaf-100 text-leaf-700' },
  cancelled: { label: 'Cancelled pre-dispatch', cls: 'bg-cream-200 text-ink' },
  held: { label: 'Held: not ordered', cls: 'bg-coral-100 text-plum' },
}
const TIER = { High: 'bg-coral-100 text-plum', Medium: 'bg-cream-200 text-ink', Low: 'bg-leaf-100 text-leaf-700' }
const VERDICT = {
  rejected: { label: 'Auto-rejected', cls: 'bg-coral-100 text-plum' },
  review: { label: 'Needs review', cls: 'bg-magenta-100 text-magenta-600' },
  verified: { label: 'Verified', cls: 'bg-leaf-100 text-leaf-700' },
}

function mmss(sec: number) {
  if (sec <= 0) return 'Due'
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}:${String(s).padStart(2, '0')}`
}

export default function Hub() {
  const [elapsed, setElapsed] = useState(0)
  const [decided, setDecided] = useState<Record<string, 'upheld' | 'overridden'>>({})
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const cod = ORDERS.filter((o) => o.cod)
  const answered = cod.filter((o) => ['confirmed', 'rescheduled', 'cancelled', 'held'].includes(o.nudge)).length
  const high = ORDERS.filter((o) => orderRisk(o).tier === 'High').length

  return (
    <div>
      <PageHeader
        eyebrow={`Surface 3 · Hub control tower · ${HUB.name}`}
        title="One screen for every parcel at risk"
        lede="The supervisor sees risk, reconfirmation status and dispatch deadlines together, reviews flagged rider marks, and watches the resale shelf clock."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Orders on today's board" value={ORDERS.length} />
        <Stat label="High-risk orders" value={high} tone="magenta" />
        <Stat label="COD nudges answered" value={`${answered} of ${cod.length}`} tone="leaf" />
        <Stat label="Flagged attempt marks" value={FLAGGED.filter((f) => f.verdict !== 'verified' && !decided[f.id]).length} />
      </div>

      <section aria-labelledby="ord-h" className="card mb-6">
        <h2 id="ord-h" className="text-xl font-bold">Orders before dispatch</h2>
        {/* Below 768 px: one card per order, so risk, nudge status and the dispatch timer are visible without scrolling sideways */}
        <ul className="mt-3 md:hidden space-y-3" data-testid="orders-cards" aria-label="Orders with RTO risk, nudge status and dispatch SLA">
          {ORDERS.map((o) => {
            const r = orderRisk(o)
            const left = o.slaMin * 60 - elapsed
            return (
              <li key={o.id} className="rounded-xl border border-plum/10 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-ink">{o.id}</p>
                  <p className={`num font-semibold ${o.nudge === 'cancelled' ? 'text-ink-soft' : left < 30 * 60 ? 'text-magenta-600' : 'text-ink'}`}>
                    <span className="sr-only">Dispatch in </span>{o.nudge === 'cancelled' ? 'Not dispatching' : mmss(left)}
                  </p>
                </div>
                <p className="text-sm text-ink-soft">{o.item} · {o.area} {o.pin} · {o.band} · {o.cod ? `COD ${rupees(o.price)}` : 'Prepaid'}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={`chip ${TIER[r.tier]}`}>{r.tier} · {pctTrim(Math.round(r.est * 1000) / 1000)}</span>
                  <span className={`chip ${NUDGE[o.nudge].cls}`}>{NUDGE[o.nudge].label}</span>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="mt-3 hidden md:block overflow-x-auto" data-testid="orders-table">
          <table className="w-full min-w-[680px] text-left text-[15px]">
            <caption className="sr-only">Orders with RTO risk, nudge status and dispatch SLA</caption>
            <thead className="text-ink-soft text-sm">
              <tr><th className="py-2 px-3">Order</th><th className="px-3">Area</th><th className="px-3">Pay</th><th className="px-3">RTO risk</th><th className="px-3">Nudge status</th><th className="px-3">Dispatch in</th></tr>
            </thead>
            <tbody>
              {ORDERS.map((o) => {
                const r = orderRisk(o)
                const left = o.slaMin * 60 - elapsed
                return (
                  <tr key={o.id} className="border-t border-plum/10">
                    <td className="py-2.5 px-3 font-semibold">{o.id}<div className="text-sm font-normal text-ink-soft">{o.item}</div></td>
                    <td className="px-3">{o.area}<div className="text-sm text-ink-soft">{o.pin} · {o.band}</div></td>
                    <td className="px-3">{o.cod ? `COD ${rupees(o.price)}` : 'Prepaid'}</td>
                    <td className="px-3"><span className={`chip ${TIER[r.tier]}`}>{r.tier} · {pctTrim(Math.round(r.est * 1000) / 1000)}</span></td>
                    <td className="px-3"><span className={`chip ${NUDGE[o.nudge].cls}`}>{NUDGE[o.nudge].label}</span></td>
                    <td className={`px-3 num font-semibold ${o.nudge === 'cancelled' ? 'text-ink-soft' : left < 30 * 60 ? 'text-magenta-600' : 'text-ink'}`}>
                      {o.nudge === 'cancelled' ? 'Not dispatching' : mmss(left)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-ink-soft text-sm">Risk estimate = distance-band RTO rate adjusted for payment mode (illustrative). Timers run live in this demo.</p>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section aria-labelledby="flag-h" className="card">
          <h2 id="flag-h" className="text-xl font-bold">Attempt marks queue</h2>
          <ul className="mt-3 space-y-3">
            {FLAGGED.map((f) => (
              <li key={f.id} className="rounded-xl border border-plum/10 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{f.id}</span>
                  <span className="text-ink-soft">{f.order} · {f.rider}</span>
                  <span className={`chip ml-auto ${VERDICT[f.verdict].cls}`}>{VERDICT[f.verdict].label}</span>
                </div>
                <p className="mt-1 text-ink">{f.reason}</p>
                {f.verdict !== 'verified' && (
                  decided[f.id] ? (
                    <p className="mt-2 text-leaf-700 font-semibold" role="status">{decided[f.id] === 'upheld' ? 'Rejection upheld: parcel back on route.' : 'Overridden: attempt accepted.'}</p>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <button className="btn-plum min-h-[40px] text-sm" onClick={() => setDecided((d) => ({ ...d, [f.id]: 'upheld' }))}>Uphold</button>
                      <button className="btn-ghost min-h-[40px] text-sm" onClick={() => setDecided((d) => ({ ...d, [f.id]: 'overridden' }))}>Override</button>
                    </div>
                  )
                )}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="shelf-h" className="card">
          <h2 id="shelf-h" className="text-xl font-bold">Resale shelf</h2>
          <p className="text-ink-soft">{inputs.m2WindowDays} business days to find a local buyer, then standard RTO.</p>
          <ul className="mt-3 space-y-3">
            {SHELF.map((p) => {
              const checkedIn = addBusinessDays(DEMO_TODAY, -p.checkedInDaysAgo)
              const deadline = addBusinessDays(checkedIn, inputs.m2WindowDays)
              const left = businessDaysBetween(DEMO_TODAY, deadline)
              const pct = Math.max(0, Math.min(1, left / inputs.m2WindowDays))
              return (
                <li key={p.id} className="rounded-xl border border-plum/10 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{p.item}</span>
                    <span className="text-ink-soft">{rupees(p.price)}</span>
                    <span className={`chip ml-auto ${p.status === 'matched' ? 'bg-leaf-100 text-leaf-700' : p.status === 'reverting' ? 'bg-cream-200 text-ink' : 'bg-magenta-100 text-magenta-600'}`}>
                      {p.status === 'matched' ? 'Buyer matched' : p.status === 'reverting' ? 'Reverting to RTO' : 'Matching'}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-cream-200" role="progressbar" aria-label={`${p.item} time left`} aria-valuemin={0} aria-valuemax={inputs.m2WindowDays} aria-valuenow={left}>
                    <div className={`h-2 rounded-full ${left <= 1 ? 'bg-magenta' : 'bg-plum'}`} style={{ width: `${pct * 100}%` }} />
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    {left > 0 ? `${left} business day${left === 1 ? '' : 's'} left` : 'Window closed'} · deadline {deadline.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </li>
              )
            })}
          </ul>
          <a href="#/resale" className="btn-ghost mt-4">Walk through a resale →</a>
        </section>
      </div>
    </div>
  )
}
