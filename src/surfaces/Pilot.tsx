import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { PageHeader, Callout, SimBadge } from '../components/ui'
import { A } from '../data/assumptions'
import { PILOT_SIM } from '../data/scenario'
import { pilotSizing, pilotSeries, upiSwitch, messagingCostPerOrder, combined, pct, pctTrim, rupees, count, defaultInputs } from '../lib/model'

const inputs = defaultInputs()
const size = pilotSizing()
const series = pilotSeries()
const target = combined('conservative').rtoRateAfter

const PHASES = [
  { days: `Days 1–${inputs.pilotPhaseDays}`, title: 'Ask and verify', body: 'Reconfirmation ladder and rider masked-call validation switch on in all treatment pincodes. Control pincodes run as today.' },
  { days: `Days ${inputs.pilotPhaseDays + 1}–${inputs.pilotPhaseDays * 2}`, title: 'Add hub resale', body: 'Resale shelf opens at the treatment hubs for opted-in sellers. Match rate and handling cost are measured per parcel.' },
  { days: `Days ${inputs.pilotPhaseDays * 2 + 1}–${inputs.pilotDays}`, title: 'Tune and decide', body: `UPI discount test (${rupees(A.upiDiscountAlt.value)} vs ${rupees(A.upiDiscount.value)}), then a scale / fix / stop decision against the guardrails.` },
]

export default function Pilot() {
  const upi = upiSwitch(A.upiDiscountAlt.value)
  const metrics = [
    { name: 'RTO %', sim: pctTrim(Math.round(series[series.length - 1].treatment * 1000) / 1000), note: `Control ${pctTrim(Math.round(series[series.length - 1].control * 1000) / 1000)}` },
    { name: 'Reconfirmation response rate', sim: pct(PILOT_SIM.responseRate), note: 'Replies to any ladder step' },
    { name: 'Resale match rate', sim: pct(inputs.m2Match), note: 'Eligible parcels resold in the window' },
    { name: 'Fake-attempt rejection rate', sim: pct(PILOT_SIM.fakeRejectRate), note: 'Unavailable marks auto-rejected' },
    { name: 'Net saving per UPI switch', sim: rupees(upi.net), note: `At a ${rupees(A.upiDiscountAlt.value)} discount` },
    { name: 'Opt-out / complaint rate', sim: pct(PILOT_SIM.optOutRate, 1), note: 'Messages muted or complaints raised' },
  ]
  const guardrails = [
    { name: 'Rider earnings per shift', rule: 'No decrease vs control' },
    { name: 'Cost per order', rule: `No more than +₹${messagingCostPerOrder().toFixed(2)} per order (messaging + IVR)` },
    { name: 'Delivery TAT', rule: `No more than +${inputs.pilotTatSlackDays} day vs control` },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Surface 6 · Pilot plan"
        title={`${inputs.pilotPincodes} pincodes, a matched control, ${inputs.pilotDays} days`}
        lede="How we would prove it before scaling. Everything on this page is simulated to show what the pilot readout would look like."
      >
        <SimBadge className="mt-3" />
      </PageHeader>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <section className="card" aria-labelledby="design-h">
          <h2 id="design-h" className="text-xl font-bold">Design</h2>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <PinGrid label={`Treatment: ${inputs.pilotPincodes} pincodes`} n={inputs.pilotPincodes} color="bg-plum" />
            <PinGrid label={`Control: ${inputs.pilotControlPincodes} matched pincodes`} n={inputs.pilotControlPincodes} color="bg-cream-200 border border-plum/20" />
          </div>
          <p className="mt-3 text-ink">Pincodes are matched on COD share, distance band and order volume.</p>
        </section>
        <section className="card" aria-labelledby="size-h">
          <h2 id="size-h" className="text-xl font-bold">Statistical sizing</h2>
          <p className="mt-2 text-lg text-ink">
            At least <strong className="num">{inputs.pilotMinOrdersPerPinWeek} orders per pincode per week, across the {inputs.pilotDays}-day pilot</strong>.
          </p>
          <p className="mt-2 text-ink">That is about {count(size.minOrdersPerPin)} orders per pincode and {count(size.minTreatmentOrders)} treatment orders over {size.weeks} weeks. The threshold applies to the whole pilot, not to each 30-day phase.</p>
        </section>
      </div>

      <section className="card mb-6" aria-labelledby="tl-h">
        <h2 id="tl-h" className="text-xl font-bold">30-60-90 timeline</h2>
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

      <section className="card mb-6" aria-labelledby="ch-h">
        <div className="flex flex-wrap items-center gap-3"><h2 id="ch-h" className="text-xl font-bold">Weekly RTO %, treatment vs control</h2><SimBadge /></div>
        <div className="mt-4 h-72" role="img" aria-label={`Simulated weekly RTO: control stays near ${pctTrim(series[0].control)}, treatment falls toward ${pctTrim(target)} by week 4.`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#efe3da" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 13, fill: '#5C4756' }} tickFormatter={(w) => `W${w}`} />
              <YAxis domain={[0.1, 0.2]} ticks={[0.1, 0.12, 0.14, 0.16, 0.18, 0.2]} tickFormatter={(v) => pct(v)} tick={{ fontSize: 13, fill: '#5C4756' }} width={44} />
              <Tooltip formatter={(v: unknown, n) => [pct(Number(v), 1), n === 'treatment' ? 'Treatment' : 'Control']} labelFormatter={(w) => `Week ${w} (simulated)`} />
              <Legend formatter={(v) => <span style={{ color: '#2A1424' }}>{v === 'treatment' ? 'Treatment pincodes' : 'Control pincodes'}</span>} />
              <Line type="monotone" dataKey="control" stroke="#5C4756" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="treatment" stroke="#C2186B" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <section className="card" aria-labelledby="m-h">
          <h2 id="m-h" className="text-xl font-bold">Named metrics (simulated readout at day {inputs.pilotDays})</h2>
          <ul className="mt-3 grid sm:grid-cols-2 gap-3">
            {metrics.map((m) => (
              <li key={m.name} className="rounded-xl bg-cream p-3">
                <p className="text-ink-soft">{m.name}</p>
                <p className="num text-2xl font-bold text-plum">{m.sim}</p>
                <p className="text-sm text-ink-soft">{m.note}</p>
              </li>
            ))}
          </ul>
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
      <div className="mt-6"><Callout>All pilot figures here are simulated. Real pincodes, partners and targets would be agreed with Valmo operations.</Callout></div>
    </div>
  )
}

function PinGrid({ label, n, color }: { label: string; n: number; color: string }) {
  return (
    <figure>
      <div className="grid grid-cols-5 gap-1.5" aria-hidden>
        {Array.from({ length: n }, (_, k) => <span key={k} className={`aspect-square rounded-md ${color}`} />)}
      </div>
      <figcaption className="mt-2 text-sm font-semibold text-ink">{label}</figcaption>
    </figure>
  )
}
