import { useMemo, useState } from 'react'
import { PageHeader, Callout, SimBadge, SourcePill } from '../components/ui'
import { A, PILOT_CALC_RANGES, PILOT_ICC_TABLE, PILOT_REFERENCE_SHIFT } from '../data/assumptions'
import {
  pilotSizing, pilotPower, mde, effectiveN, twoPropN, weeksNeeded, designEffect, pincodesNeeded, upiSwitch, messagingCostPerOrder,
  pct, rupees, count, defaultInputs, type PowerDesign,
} from '../lib/model'

const base = defaultInputs()
const size = pilotSizing()
const planned = pilotPower()

const PHASES = [
  { days: `Days 1–${base.pilotPhaseDays}`, title: 'Ask and verify', body: 'The reconfirmation ladder and rider masked-call validation switch on in all treatment pincodes. Control pincodes run as today.' },
  { days: `Days ${base.pilotPhaseDays + 1}–${base.pilotPhaseDays * 2}`, title: 'Add hub resale', body: 'The resale shelf opens at treatment hubs for opted-in sellers. Match rate and handling cost are measured per parcel.' },
  { days: `Days ${base.pilotPhaseDays * 2 + 1}–${base.pilotDays}`, title: 'Tune and decide', body: `UPI discount test (${rupees(A.upiDiscountAlt.value)} vs ${rupees(A.upiDiscount.value)}), then a scale / fix / stop decision against the guardrails.` },
]

const METRICS = [
  { name: 'RTO %', how: 'Primary outcome. Share of shipped orders returned to origin, per pincode-week, treatment vs control.' },
  { name: 'Reconfirmation response rate', how: 'Share of nudged orders with a reply at any ladder step.' },
  { name: 'Resale match rate', how: `Share of eligible refused parcels resold within the ${A.m2WindowDays.value}-business-day window.` },
  { name: 'Fake-attempt rejection rate', how: '"Customer unavailable" marks auto-rejected for having no logged masked call.' },
  { name: 'Net saving per UPI switch', how: `Measured RTO gap for switched orders × ${rupees(A.reverseCost.value)}, minus the discount.` },
  { name: 'Opt-out / complaint rate', how: 'Messages muted or complaints raised, per 1,000 nudged orders.' },
]

const pts = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(1)} pts` : 'not reachable')
const points = (x: number) => `${(x * 100).toFixed(1)} points`

export default function Pilot() {
  const [p1, setP1] = useState(planned.p1)
  const [shift, setShift] = useState(planned.shift)
  const [pins, setPins] = useState(base.pilotPincodesTreated)
  const [perWeek, setPerWeek] = useState(base.pilotOrdersPerPinWeek)
  const [weeks, setWeeks] = useState(size.weeks)
  const [icc, setIcc] = useState(base.pilotIcc)

  const r = useMemo(() => {
    const d: PowerDesign = { pincodesPerArm: pins, ordersPerPinWeek: perWeek, weeks, icc }
    const p2 = Math.max(0.001, p1 - shift)
    const nU = Math.ceil(twoPropN(p1, p2, base.pilotAlpha, base.pilotPower))
    const eff = effectiveN(d)
    return {
      d, p2, nU, eff,
      mde: mde(p1, d, base.pilotAlpha, base.pilotPower),
      weeksNeeded: weeksNeeded(p1, p2, { pincodesPerArm: pins, ordersPerPinWeek: perWeek, icc }, base.pilotAlpha, base.pilotPower),
      detectable: eff.eff >= nU,
      ceiling: icc > 0 ? pins / icc : Infinity,
      options: [
        { label: 'This design', d },
        { label: 'Double the weeks', d: { ...d, weeks: weeks * 2 } },
        { label: 'Double the pincodes', d: { ...d, pincodesPerArm: pins * 2 } },
        { label: 'Four times the pincodes', d: { ...d, pincodesPerArm: pins * 4 } },
      ].map((o) => ({ ...o, mde: mde(p1, o.d, base.pilotAlpha, base.pilotPower) })),
      byIcc: PILOT_ICC_TABLE.map((c) => ({
        icc: c,
        mde: mde(p1, { ...d, icc: c }, base.pilotAlpha, base.pilotPower),
        pinsFor3: pincodesNeeded(p1, p1 - PILOT_REFERENCE_SHIFT, { ordersPerPinWeek: perWeek, weeks, icc: c }, base.pilotAlpha, base.pilotPower),
      })),
      pinsFor3: pincodesNeeded(p1, p1 - PILOT_REFERENCE_SHIFT, { ordersPerPinWeek: perWeek, weeks, icc }, base.pilotAlpha, base.pilotPower),
      pinsForTarget: pincodesNeeded(p1, p2, { ordersPerPinWeek: perWeek, weeks, icc }, base.pilotAlpha, base.pilotPower),
    }
  }, [p1, shift, pins, perWeek, weeks, icc])

  const isPlanned = p1 === planned.p1 && shift === planned.shift && pins === base.pilotPincodesTreated && perWeek === base.pilotOrdersPerPinWeek && weeks === size.weeks && icc === base.pilotIcc
  const reset = () => { setP1(planned.p1); setShift(planned.shift); setPins(base.pilotPincodesTreated); setPerWeek(base.pilotOrdersPerPinWeek); setWeeks(size.weeks); setIcc(base.pilotIcc) }

  const ref = PILOT_REFERENCE_SHIFT
  const refPts = (ref * 100).toFixed(0)
  const reachable = r.mde <= ref
  // One target at a time: the headline speaks only to the target set in the calculator.
  const headline = [
    `With ${pins} treated and ${pins} control pincodes, ${perWeek} orders per pincode per week for ${weeks} weeks, and an ICC of ${String(+icc.toFixed(3))},`,
    `this pilot can detect a drop of about ${points(r.mde)} (from ${pct(p1, 1)} to about ${pct(Math.max(0, p1 - r.mde), 1)}).`,
    r.detectable
      ? `The ${(shift * 100).toFixed(1)}-point target is within reach.`
      : `The ${(shift * 100).toFixed(1)}-point target is smaller than that, so detecting it would take about ${count(r.pinsForTarget)} pincodes per arm.`,
    'More pincodes help; more weeks barely do.',
  ].join(' ')
  const icc01 = r.byIcc.find((x) => x.icc === 0.01)?.pinsFor3
  const icc05 = r.byIcc.find((x) => x.icc === 0.05)?.pinsFor3

  const upi = upiSwitch(A.upiDiscountAlt.value)
  const guardrails = [
    { name: 'Rider earnings per shift', rule: 'No decrease vs control' },
    { name: 'Cost per order', rule: `No more than +₹${messagingCostPerOrder().toFixed(2)} per order (messaging + IVR)` },
    { name: 'Delivery TAT', rule: `No more than +${base.pilotTatSlackDays} day vs control` },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Surface 6 · Pilot plan"
        title={`The ${size.treated} highest-RTO pincodes against ${size.control} matched controls, ${base.pilotDays} days`}
        lede="How we would test it before scaling, and what this pilot can and cannot detect."
      >
        <SimBadge className="mt-3" />
      </PageHeader>

      <section aria-labelledby="honest-h" className="mb-6">
        <Callout tone="warn">
          <h2 id="honest-h" className="font-sans text-lg font-bold text-ink">What this pilot can detect</h2>
          <p className="mt-1 text-ink" data-testid="pilot-headline">{headline}</p>
          <p className="mt-2 text-sm text-ink-soft">This sentence is generated from the calculator below and updates with it.</p>
        </Callout>
      </section>

      <section aria-labelledby="calc-h" className="card mb-6">
        <h2 id="calc-h" className="text-xl font-bold">Power calculator</h2>
        <p className="text-ink-soft">
          Two-proportion z-test, two-sided α = {base.pilotAlpha}, power = {pct(base.pilotPower)}, randomised by pincode.
          Design effect = 1 + (m − 1) × ICC, where m = orders per pincode over the pilot.
        </p>
        <div className="mt-4 grid md:grid-cols-2 gap-x-8 gap-y-5">
          <Slider id="pc-base" label="Baseline RTO" value={p1} fmt={(v) => pct(v, 1)} {...PILOT_CALC_RANGES.baseline} onChange={setP1} tag="case" />
          <Slider id="pc-shift" label="Target reduction" value={shift} fmt={pts} {...PILOT_CALC_RANGES.shift} onChange={setShift} tag="assumption" />
          <Slider id="pc-pins" label="Pincodes per arm (treated = control)" value={pins} fmt={String} {...A.pilotPincodesTreated.range!} onChange={setPins} tag="assumption" />
          <Slider id="pc-week" label="Orders per pincode per week" value={perWeek} fmt={String} {...A.pilotOrdersPerPinWeek.range!} onChange={setPerWeek} tag="assumption" />
          <Slider id="pc-weeks" label="Weeks" value={weeks} fmt={String} {...PILOT_CALC_RANGES.weeks} onChange={setWeeks} tag="assumption" />
          <Slider id="pc-icc" label="ICC (how alike orders in one pincode are)" value={icc} fmt={(v) => v.toFixed(3)} {...A.pilotIcc.range!} onChange={setIcc} tag="assumption" />
        </div>

        <dl className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3" aria-live="polite">
          <div className="rounded-xl bg-cream p-3">
            <dt className="text-ink-soft">Orders per arm needed (no clustering)</dt>
            <dd className="num text-2xl font-bold text-plum" data-testid="n-unclustered">{count(r.nU)}</dd>
            <dd className="text-sm text-ink-soft">{pct(p1, 1)} → {pct(r.p2, 1)}</dd>
          </div>
          <div className="rounded-xl bg-cream p-3">
            <dt className="text-ink-soft">With clustering (× DEFF {r.eff.deff.toFixed(1)})</dt>
            <dd className="num text-2xl font-bold text-plum">{count(Math.ceil(r.nU * r.eff.deff))}</dd>
            <dd className="text-sm text-ink-soft">This design has {count(r.eff.raw)} per arm (≈ {count(r.eff.eff)} effective)</dd>
          </div>
          <div className="rounded-xl bg-cream p-3">
            <dt className="text-ink-soft">Minimum detectable effect (this design)</dt>
            <dd className="num text-2xl font-bold text-magenta-600" data-testid="mde">{pts(r.mde)}</dd>
            <dd className="text-sm text-ink-soft">{r.detectable ? 'The target is detectable' : 'The target is smaller than this'}</dd>
          </div>
          <div className="rounded-xl bg-cream p-3">
            <dt className="text-ink-soft">Weeks needed for the target</dt>
            <dd className="num text-2xl font-bold text-plum" data-testid="weeks-needed">{Number.isFinite(r.weeksNeeded) ? r.weeksNeeded : 'Never'}</dd>
            <dd className="text-sm text-ink-soft">
              {Number.isFinite(r.weeksNeeded)
                ? `at ${pins} pincodes per arm`
                : `The effective sample can't exceed ${count(r.ceiling)} per arm at ${pins} pincodes: add pincodes`}
            </dd>
          </div>
        </dl>
        <div className="mt-3 rounded-xl border border-plum/15 p-3" data-testid="pins-box">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-ink-soft">Pincodes per arm needed for a {refPts}-point shift at ICC {String(+icc.toFixed(3))}:</span>
            <span className="num text-2xl font-bold text-plum" data-testid="pins-for-3">{count(r.pinsFor3)}</span>
          </p>
          <p className="mt-1 text-ink">
            {reachable ? `This design (${pins} per arm) already covers a ${refPts}-point shift.` : `This design has ${pins} per arm, so a ${refPts}-point shift is out of reach.`}
            {' '}For comparison: {count(icc01 ?? NaN)} per arm at ICC 0.01 and {count(icc05 ?? NaN)} at ICC 0.05 ({perWeek} orders per pincode per week, {weeks} weeks).
          </p>
        </div>
        {!isPlanned && <button className="btn-ghost mt-4" onClick={reset}>Reset to the planned design</button>}
      </section>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <section aria-labelledby="pw-h" className="card">
          <h2 id="pw-h" className="text-xl font-bold">More pincodes beat more weeks</h2>
          <p className="text-ink-soft">MDE at ICC {icc.toFixed(3)}. Extra weeks only add orders inside the same clusters.</p>
          <table className="mt-3 w-full text-left" data-testid="pincodes-vs-weeks">
            <thead className="text-sm text-ink-soft"><tr><th className="py-1">Design</th><th>Pincodes/arm</th><th>Weeks</th><th>MDE</th></tr></thead>
            <tbody>
              {r.options.map((o) => (
                <tr key={o.label} className="border-t border-plum/10">
                  <td className="py-2">{o.label}</td><td className="num">{o.d.pincodesPerArm}</td><td className="num">{o.d.weeks}</td><td className="num font-semibold">{pts(o.mde)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section aria-labelledby="icc-h" className="card">
          <h2 id="icc-h" className="text-xl font-bold">How much clustering matters</h2>
          <p className="text-ink-soft">MDE for this design as the ICC varies, and the pincodes per arm a {refPts}-point shift would need. The ICC is an assumption until the pilot measures it.</p>
          <table className="mt-3 w-full text-left" data-testid="mde-by-icc">
            <thead className="text-sm text-ink-soft"><tr><th className="py-1">ICC</th><th>Design effect</th><th>MDE</th><th>Pincodes/arm for {refPts} pts</th></tr></thead>
            <tbody>
              {r.byIcc.map((x) => (
                <tr key={x.icc} className={`border-t border-plum/10 ${x.icc === icc ? 'font-bold bg-plum-100/50' : ''}`}>
                  <td className="py-2 num">{x.icc.toFixed(2)}</td><td className="num">{designEffect(r.eff.m, x.icc).toFixed(1)}</td><td className="num">{pts(x.mde)}</td><td className="num">{count(x.pinsFor3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="card mb-6" aria-labelledby="tl-h">
        <h2 id="tl-h" className="text-xl font-bold">30-60-90 timeline</h2>
        <p className="text-ink-soft">
          The sample size applies to the whole {base.pilotDays}-day pilot ({size.weeks} weeks at {base.pilotOrdersPerPinWeek} orders per pincode per week), not to each 30-day phase.
        </p>
        <ol className="mt-4 grid md:grid-cols-3 gap-4">
          {PHASES.map((p, n) => (
            <li key={p.title} className="rounded-xl bg-cream p-4 border-t-4 border-magenta">
              <p className="chip bg-white text-plum">Phase {n + 1} · {p.days}</p>
              <h3 className="mt-2 text-lg font-bold">{p.title}</h3>
              <p className="mt-1 text-ink">{p.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <section className="card" aria-labelledby="m-h">
          <h2 id="m-h" className="text-xl font-bold">What we would measure</h2>
          <p className="text-ink-soft">Definitions only. There are no results yet.</p>
          <ul className="mt-3 grid sm:grid-cols-2 gap-3">
            {METRICS.map((m) => (
              <li key={m.name} className="rounded-xl bg-cream p-3">
                <p className="font-semibold text-plum">{m.name}</p>
                <p className="text-ink">{m.how}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-soft">
            The UPI switch is planned at a {rupees(A.upiDiscountAlt.value)} discount: {rupees(upi.expectedSaving)} expected saving, {rupees(upi.net)} net per switch (model).
          </p>
        </section>
        <section className="card" aria-labelledby="g-h">
          <h2 id="g-h" className="text-xl font-bold">Guardrails</h2>
          <p className="text-ink-soft">Breach any one and the pilot pauses.</p>
          <ul className="mt-3 space-y-3">
            {guardrails.map((g) => (
              <li key={g.name} className="rounded-xl border border-plum/15 p-3">
                <p className="font-semibold text-ink">{g.name}</p>
                <p className="text-ink">{g.rule}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="mt-6"><Callout>Pincodes, partners and thresholds are a proposal to agree with Valmo operations. No pilot has been run.</Callout></div>
    </div>
  )
}

function Slider({ id, label, value, fmt, min, max, step, onChange, tag }: {
  id: string; label: string; value: number; fmt: (v: number) => string; min: number; max: number; step: number
  onChange: (v: number) => void; tag: 'case' | 'assumption'
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="font-semibold text-ink">{label}</label>
        <span className="num font-bold text-plum">{fmt(value)}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} aria-valuetext={fmt(value)}
        onChange={(e) => onChange(+e.target.value)} className="mt-2 w-full accent-magenta h-6" />
      <div className="mt-1"><SourcePill tag={tag} /></div>
    </div>
  )
}
