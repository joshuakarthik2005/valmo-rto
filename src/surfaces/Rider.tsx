import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Phone } from '../components/Phone'
import { PageHeader, Callout } from '../components/ui'
import { ORDERS } from '../data/scenario'
import { orderRisk, approxPct, validateUnavailable, riderPremium, rupees, defaultInputs } from '../lib/model'

const inputs = defaultInputs()
const MANIFEST = ORDERS.filter((o) => o.nudge !== 'cancelled' && o.nudge !== 'held').slice(0, 6)
const START_MIN = 14 * 60 + 5

type Call = { at: number; answered: boolean }
type Outcome =
  | { kind: 'delivered'; premium: number }
  | { kind: 'unavailable'; verdict: 'rejected' | 'verified' | 'review'; fee: number; reason: string; followUp: boolean }

const TIER_STYLE = { 'Above average': 'bg-coral-100 text-plum', Average: 'bg-cream-200 text-ink', 'Below average': 'bg-leaf-100 text-leaf-700' }

function clock(min: number) {
  const h = Math.floor(min / 60), m = min % 60
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function masked(id: string) {
  return `+91 80 4${id.slice(-3)} 7${id.slice(-2)}0 (masked)`
}

export default function Rider() {
  const [sel, setSel] = useState(MANIFEST[0].id)
  const [now, setNow] = useState(START_MIN)
  const [calls, setCalls] = useState<Record<string, Call[]>>({})
  const [ringing, setRinging] = useState(false)
  const [late, setLate] = useState<Record<string, number>>({})
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({})
  const [otp, setOtp] = useState('')
  const [otpOpen, setOtpOpen] = useState(false)
  const [rejected, setRejected] = useState<Record<string, string>>({})

  const o = MANIFEST.find((x) => x.id === sel)!
  const r = orderRisk(o)
  const myCalls = calls[sel] ?? []
  const done = outcomes[sel]
  const tick = (m = 3) => { const t = now + m; setNow(t); return t }

  function placeCall() { setRinging(true) }
  function endCall(answered: boolean) {
    const at = tick(2)
    setCalls((c) => ({ ...c, [sel]: [...(c[sel] ?? []), { at, answered }] }))
    setRinging(false)
  }
  function markUnavailable() {
    const v = validateUnavailable(myCalls)
    tick(1)
    if (v.verdict === 'rejected') { setRejected((x) => ({ ...x, [sel]: v.reason })); return }
    setRejected((x) => ({ ...x, [sel]: '' }))
    setOutcomes((x) => ({ ...x, [sel]: { kind: 'unavailable', verdict: v.verdict, fee: v.feeProtected, reason: v.reason, followUp: v.followUp } }))
  }
  function runningLate() { setLate((x) => ({ ...x, [sel]: tick(1) })) }
  function deliver() {
    if (otp.length !== 4) return
    tick(4)
    const premium = riderPremium({ farHub: o.band === 'far', firstAddress: o.firstAddress })
    setOutcomes((x) => ({ ...x, [sel]: { kind: 'delivered', premium } }))
    setOtp(''); setOtpOpen(false)
  }

  const protectedFees = Object.values(outcomes).reduce((s, x) => s + (x.kind === 'unavailable' ? x.fee : 0), 0)
  const premiums = Object.values(outcomes).reduce((s, x) => s + (x.kind === 'delivered' ? x.premium : 0), 0)
  const deliveredCount = Object.values(outcomes).filter((x) => x.kind === 'delivered').length

  return (
    <div>
      <PageHeader
        eyebrow="Surface 2 · Rider app · fake-attempt fix"
        title="Every “customer unavailable” is backed by a logged call"
        lede="Riders call through a masked number from inside the app. The call log, not GPS, decides whether a failed attempt is genuine. Genuine attempts keep their fee; hard deliveries earn a small premium."
      />
      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-6 order-2 lg:order-1">
          <section aria-labelledby="man-h" className="card">
            <h2 id="man-h" className="text-xl font-bold">Today's manifest</h2>
            <ul className="mt-3 divide-y divide-plum/10">
              {MANIFEST.map((m) => {
                const mr = orderRisk(m)
                const out = outcomes[m.id]
                return (
                  <li key={m.id}>
                    <button onClick={() => { setSel(m.id); setRinging(false); setOtpOpen(false) }} aria-pressed={sel === m.id}
                      className={`w-full text-left flex flex-wrap items-center gap-x-3 gap-y-1 py-3 px-2 rounded-xl ${sel === m.id ? 'bg-plum-100' : 'hover:bg-cream'}`}>
                      <span className="font-semibold text-ink w-28">{m.id}</span>
                      <span className="text-ink flex-1 min-w-[8rem]">{m.item} · {m.area}</span>
                      <span className={`chip ${TIER_STYLE[mr.tier]}`}>{approxPct(mr.est)} risk</span>
                      {out && <span className={`chip ${out.kind === 'delivered' ? 'bg-leaf-100 text-leaf-700' : out.verdict === 'verified' ? 'bg-plum-100 text-plum' : 'bg-coral-100 text-plum'}`}>
                        {out.kind === 'delivered' ? 'Delivered' : out.verdict === 'verified' ? 'Verified attempt' : out.verdict === 'rejected' ? 'Mark rejected' : 'Sent to review'}
                      </span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section aria-labelledby="earn-h" className="card" aria-live="polite">
            <h2 id="earn-h" className="text-xl font-bold">Shift earnings (this demo)</h2>
            <dl className="mt-3 grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-cream p-3"><dt className="text-ink-soft">Protected attempt fees</dt><dd className="num text-2xl font-bold text-plum">{rupees(protectedFees)}</dd></div>
              <div className="rounded-xl bg-cream p-3"><dt className="text-ink-soft">High-risk premiums</dt><dd className="num text-2xl font-bold text-leaf-700">{rupees(premiums)}</dd></div>
              <div className="rounded-xl bg-cream p-3"><dt className="text-ink-soft">Deliveries done</dt><dd className="num text-2xl font-bold text-ink">{deliveredCount}</dd></div>
            </dl>
            <p className="mt-3 text-ink-soft">
              Completed far-hub or first-time-address deliveries earn {rupees(inputs.riderPremiumMin)}; both together earn {rupees(inputs.riderPremiumMax)}.
              A verified failed attempt keeps the standard {rupees(inputs.riderAttemptFee)} attempt fee. Assumption (placeholder): not the real rate card, and not used in any headline number.
            </p>
          </section>

          <Callout>
            <p className="font-semibold">No GPS, no geofencing.</p>
            <p>Validation uses only the in-app call log. The OTP is used only to confirm a successful delivery, never to judge a failed one.</p>
          </Callout>
        </div>

        <div className="order-1 lg:order-2 lg:sticky lg:top-32">
          <Phone label="Rider app (mock)">
            <div className="bg-plum text-cream px-4 pt-9 pb-3">
              <p className="text-sm text-cream/90">Rider R-14 · {clock(now)}</p>
              <p className="font-semibold text-lg">{o.id}</p>
            </div>
            <div className="flex-1 overflow-y-auto bg-cream p-3 space-y-3">
              <div className="rounded-xl bg-white p-3">
                <p className="font-semibold text-ink">{o.name} · {o.area} {o.pin}</p>
                <p className="text-ink-soft text-sm">{o.item} · {o.cod ? `${rupees(o.price)} COD` : 'Prepaid'}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={`chip text-xs ${TIER_STYLE[r.tier]}`}>{approxPct(r.est)} · {r.tier}</span>
                  {r.reasons.map((x) => <span key={x} className="chip text-xs bg-cream-200 text-ink">{x}</span>)}
                  {r.flags.map((x) => <span key={x} className="chip text-xs bg-white text-ink border border-plum/20">{x}</span>)}
                </div>
              </div>

              {!done && (
                <>
                  <AnimatePresence>
                    {ringing ? (
                      <motion.div key="ring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl bg-plum-900 text-cream p-3 text-center space-y-2">
                        <p className="font-semibold">Calling {masked(o.id)}</p>
                        <p className="text-sm text-cream/90">Simulate the result:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="min-h-[44px] rounded-lg bg-leaf-700 font-semibold" onClick={() => endCall(true)}>Answered</button>
                          <button className="min-h-[44px] rounded-lg bg-white/15 font-semibold" onClick={() => endCall(false)}>No answer</button>
                        </div>
                      </motion.div>
                    ) : (
                      <button key="call" className="w-full min-h-[48px] rounded-xl bg-leaf-700 text-white font-semibold" onClick={placeCall}>📞 Call customer (masked)</button>
                    )}
                  </AnimatePresence>

                  <div className="rounded-xl bg-white p-3">
                    <p className="font-semibold text-ink text-sm">Call log</p>
                    {myCalls.length === 0 ? <p className="text-sm text-ink-soft">No calls yet</p> : (
                      <ul className="text-sm text-ink">
                        {myCalls.map((c, n) => <li key={n}>{clock(c.at)} · placed · {c.answered ? 'answered' : 'not answered'}</li>)}
                      </ul>
                    )}
                    {late[sel] && <p className="text-sm text-plum mt-1">{clock(late[sel])} · “Running late” sent to customer</p>}
                  </div>

                  {rejected[sel] && (
                    <div role="alert" className="rounded-xl bg-coral-100 p-3">
                      <p className="font-bold text-plum">Auto-rejected</p>
                      <p className="text-ink text-sm">{rejected[sel]} Place a masked call first; the parcel stays on your route.</p>
                    </div>
                  )}

                  {otpOpen ? (
                    <div className="rounded-xl bg-white p-3 space-y-2">
                      <label htmlFor="otp" className="block text-sm font-semibold text-ink">Customer's delivery OTP</label>
                      <input id="otp" inputMode="numeric" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full min-h-[44px] rounded-lg border border-plum/30 px-3 text-lg tracking-[0.5em]" placeholder="1234" />
                      <button className="w-full min-h-[44px] rounded-lg bg-plum text-cream font-semibold disabled:opacity-50" disabled={otp.length !== 4} onClick={deliver}>Confirm delivery</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button className="min-h-[44px] rounded-lg bg-plum text-cream font-semibold" onClick={() => setOtpOpen(true)}>Delivered (OTP)</button>
                      <button className="min-h-[44px] rounded-lg bg-white text-plum font-semibold border border-plum/20" onClick={runningLate}>Running late</button>
                      <button className="col-span-2 min-h-[44px] rounded-lg bg-white text-magenta-600 font-semibold border border-magenta/40" onClick={markUnavailable} data-testid="mark-unavailable">
                        Mark customer unavailable
                      </button>
                    </div>
                  )}
                </>
              )}

              {done && (
                <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} role="status"
                  className={`rounded-xl p-3 ${done.kind === 'delivered' ? 'bg-leaf-100' : done.verdict === 'verified' ? 'bg-plum-100' : 'bg-coral-100'}`}>
                  {done.kind === 'delivered' ? (
                    <>
                      <p className="font-bold text-leaf-700">Delivered, OTP matched</p>
                      <p className="text-ink">{done.premium > 0 ? `High-risk premium earned: ${rupees(done.premium)}` : 'Standard delivery, no premium.'}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-plum">
                        {done.verdict === 'rejected' && 'Auto-rejected'}
                        {done.verdict === 'verified' && 'Verified attempt'}
                        {done.verdict === 'review' && 'Sent to hub review'}
                      </p>
                      <p className="text-ink">{done.reason}</p>
                      {done.verdict === 'verified' && <p className="text-ink">Attempt fee protected: {rupees(done.fee)}. Automated follow-up sent to the customer to rebook.</p>}
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </Phone>
          <p className="mt-3 text-center text-sm text-ink-soft">Try marking unavailable before calling.</p>
        </div>
      </div>
    </div>
  )
}
