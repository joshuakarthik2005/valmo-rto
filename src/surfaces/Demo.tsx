import { lazy, Suspense, useEffect, useMemo, useState, type ComponentType, type LazyExoticComponent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRoute, setParams } from '../lib/router'
import { baseline, combined, replyValue, move2PerParcel, pilotPower, pilotSizing, pincodesNeeded, lakh, rupees, pct, pctTrim, count, defaultInputs } from '../lib/model'
import { VerifyCard } from '../components/VerifyCard'
import { PILOT_REFERENCE_SHIFT } from '../data/assumptions'
// Already in the main bundle (it is the home page), so no extra round trip for step 1
import Landing from './Landing'

const load = {
  customer: () => import('./Customer'),
  rider: () => import('./Rider'),
  hub: () => import('./Hub'),
  resale: () => import('./Resale'),
  impact: () => import('./Impact'),
  pilot: () => import('./Pilot'),
}
const Customer = lazy(load.customer)
const Rider = lazy(load.rider)
const Hub = lazy(load.hub)
const Resale = lazy(load.resale)
const Impact = lazy(load.impact)
const Pilot = lazy(load.pilot)


const i = defaultInputs()
const pp = pilotPower()
const pp3 = pincodesNeeded(pp.p1, pp.p1 - PILOT_REFERENCE_SHIFT, { ordersPerPinWeek: i.pilotOrdersPerPinWeek, weeks: pilotSizing().weeks, icc: i.pilotIcc }, i.pilotAlpha, i.pilotPower)
const b = baseline()
const lo = combined('conservative')
const hi = combined('ceiling')

interface Step { title: string; caption: string; surface: LazyExoticComponent<ComponentType> | ComponentType | null; link: string; secs: number }

const STEPS: Step[] = [
  { title: 'The problem', caption: `${pctTrim(b.rtoRate)} of orders come back: ${count(b.rtos)} per lakh. Counting only the ${rupees(i.reverseCost)} return leg, that is ${lakh(b.trueDrag)} of true drag, and COD orders return ${b.codGap.toFixed(1)}× as often as prepaid.`, surface: Landing, link: '#/', secs: 12 },
  { title: 'Customer: ask first', caption: 'Before dispatch, every COD or first-time-address order climbs a ladder: WhatsApp at T-48h, the delivery window at T-24h, an IVR call at T-2h, and a hub call if there is still no reply.', surface: Customer, link: '#/customer', secs: 13 },
  { title: 'Customer: every reply has a value', caption: `Confirm counts ${rupees(replyValue('confirm').amount)}. A COD to UPI switch is worth ${rupees(replyValue('upi').amount)} expected. Cancel or “I didn't order this” avoids up to ${rupees(replyValue('cancel').amount)} per case, and those ceilings are never added to the Move 1 total.`, surface: Customer, link: '#/customer', secs: 13 },
  { title: 'Rider: no fake attempts', caption: 'Riders call through a masked number. Marking “unavailable” with no logged call is auto-rejected. A logged but unanswered call is a verified attempt: the fee is protected and the customer gets a follow-up. No GPS anywhere.', surface: Rider, link: '#/rider', secs: 14 },
  { title: 'Rider: paid for the hard ones', caption: `Completed far-hub or first-time-address deliveries earn a ${rupees(i.riderPremiumMin)}–${rupees(i.riderPremiumMax)} premium. The OTP only confirms successful delivery.`, surface: Rider, link: '#/rider', secs: 10 },
  { title: 'Hub control tower', caption: 'One screen for risk, nudge status and dispatch SLA, plus a queue of rejected or flagged attempt marks and the resale shelf countdown.', surface: Hub, link: '#/hub', secs: 11 },
  { title: 'Resale: refused, then resold nearby', caption: `A refused parcel passes six checks, including the ${rupees(i.m2PriceCap)} cap. It is matched to a nearby buyer (same device blocked), invoiced automatically and delivered the next day. No match in ${i.m2WindowDays} business days means standard RTO.`, surface: Resale, link: '#/resale', secs: 14 },
  { title: 'Resale economics', caption: `Each resold parcel saves ${rupees(move2PerParcel().net)} net: ${rupees(i.reverseCost)} return avoided, minus ${rupees(move2PerParcel().handling)} handling and a ${rupees(i.m2BuyerDiscount)} buyer discount. The seller is paid a normal settlement because it is a new sale.`, surface: Resale, link: '#/resale', secs: 11 },
  { title: 'Impact', caption: `Sequenced, the two moves net ${lakh(lo.net)} to ${lakh(hi.net)} per lakh orders, which is ${pct(lo.shareOfDrag)} to ${pct(hi.shareOfDrag)} of the drag. Illustrative RTO goes from ${pctTrim(b.rtoRate)} to ${pctTrim(lo.rtoRateAfter)}. Every slider is tagged with its source.`, surface: Impact, link: '#/impact', secs: 14 },
  { title: 'Pilot', caption: `The ${i.pilotPincodesTreated} highest-RTO pincodes against ${i.pilotPincodesControl} matched controls over ${i.pilotDays} days. Orders cluster by pincode, so at an ICC of ${i.pilotIcc} this pilot detects a drop of about ${(pp.mde * 100).toFixed(1)} points. A ${PILOT_REFERENCE_SHIFT * 100}-point drop would need about ${pp3} pincodes per arm. More pincodes help; more weeks barely do.`, surface: Pilot, link: '#/pilot', secs: 12 },
  { title: 'Verify it yourself', caption: 'The code, the tests that check every number above, and this replay are all public. Scan the code or open the repo.', surface: null, link: '#/', secs: 9 },
]

export const DEMO_SECONDS = STEPS.reduce((s, x) => s + x.secs, 0)

export default function Demo() {
  const { params } = useRoute()
  const start = Math.min(STEPS.length - 1, Math.max(0, Number(params.get('step') ?? 1) - 1 || 0))
  const [n, setN] = useState(start)
  const [playing, setPlaying] = useState(true)
  const [t, setT] = useState(0)
  const step = STEPS[n]
  // Deep links (#/demo?step=N) typed or clicked while already on the demo
  useEffect(() => { setN(start) }, [start])

  useEffect(() => { setT(0); setParams('/demo', new URLSearchParams({ step: String(n + 1) })) }, [n])
  // Warm the next surface so Skip never shows a loading state
  useEffect(() => {
    const id = setTimeout(() => Object.values(load).forEach((f) => void f()), 4000)
    return () => clearTimeout(id)
  }, [])
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setT((x) => x + 0.1), 100)
    return () => clearInterval(id)
  }, [playing])
  useEffect(() => {
    if (t < step.secs) return
    if (n < STEPS.length - 1) setN(n + 1)
    else setPlaying(false)
  }, [t, step.secs, n])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); setPlaying((p) => !p) }
      if (e.key === 'ArrowRight') setN((x) => Math.min(STEPS.length - 1, x + 1))
      if (e.key === 'ArrowLeft') setN((x) => Math.max(0, x - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const Surface = step.surface
  // Same element across the 100ms progress ticks, so the embedded surface does not re-render
  const stage = useMemo(() => (Surface ? <Surface /> : <div className="max-w-2xl mx-auto py-6"><VerifyCard /></div>), [Surface])
  return (
    <div>
      <div className="lg:sticky lg:top-[4.25rem] z-30 -mx-4 px-4 pb-3 bg-cream/95 backdrop-blur">
        <div className="rounded-xl2 bg-plum text-cream p-4 sm:p-5 shadow-card">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="chip bg-white/15 text-cream">Step {n + 1} of {STEPS.length}</span>
            <span className="font-semibold">{step.title}</span>
            <a href={step.link} className="ml-auto underline text-cream/90 hover:text-cream">Open this surface on its own</a>
          </div>
          <AnimatePresence mode="wait">
            <motion.p key={n} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 min-h-[9rem] sm:min-h-[5.5rem] lg:min-h-[3.75rem] text-lg sm:text-xl leading-snug" aria-live="polite" data-testid="caption">
              {step.caption}
            </motion.p>
          </AnimatePresence>
          <div className="mt-3 h-1.5 rounded-full bg-white/20" aria-hidden>
            <div className="h-1.5 rounded-full bg-coral transition-[width] duration-100" style={{ width: `${Math.min(100, (t / step.secs) * 100)}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn min-h-[40px] bg-white/15 hover:bg-white/25" onClick={() => setN(Math.max(0, n - 1))} disabled={n === 0}>Back</button>
            <button className="btn min-h-[40px] bg-cream text-plum" onClick={() => setPlaying((p) => !p)} aria-pressed={!playing}>{playing ? 'Pause' : 'Play'}</button>
            <button className="btn min-h-[40px] bg-white/15 hover:bg-white/25" onClick={() => setN(Math.min(STEPS.length - 1, n + 1))} disabled={n === STEPS.length - 1}>Skip</button>
            <button className="btn min-h-[40px] bg-white/15 hover:bg-white/25" onClick={() => { setN(0); setT(0); setPlaying(true) }}>Restart</button>
            <span className="ml-auto self-center text-sm text-cream/90">About {Math.round(DEMO_SECONDS / 60)} min · Space pauses, arrow keys step</span>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-xl2 ring-2 ring-plum/10 p-3 sm:p-5 bg-cream">
        <Suspense fallback={<p className="min-h-[100svh]" role="status">Loading…</p>}>
          {stage}
        </Suspense>
      </div>
    </div>
  )
}
