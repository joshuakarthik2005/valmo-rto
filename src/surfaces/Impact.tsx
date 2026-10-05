import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader, Segmented, SourcePill, Callout } from '../components/ui'
import { A, ROOT_CAUSE_SAMPLE, ROOT_CAUSE_SOURCE, OPEN_ITEMS, type AssumptionId } from '../data/assumptions'
import {
  baseline, combined, waterfall, rootCauses, sensitivity, upiSwitch, networkIllustration, distanceGradient,
  defaultInputs, lakh, rupees, pct, pctTrim, count, type Case, type Move2Mode, type Inputs,
} from '../lib/model'
import { useRoute, setParams } from '../lib/router'

const SLIDERS: AssumptionId[] = ['m1Definitely', 'm1Maybe', 'm1Haircut', 'm1MessagingCost', 'm2Match', 'm2BuyerDiscount', 'upiDiscount', 'codShare']
const COLORS = { total: '#5A0F47', down: '#1F6B42', up: '#C2186B' }

function fmt(id: AssumptionId, v: number) {
  const u = A[id].unit
  return u === 'share' ? pct(v) : u === 'rupees' ? (v >= 10_000 ? lakh(v, 2) : rupees(v)) : count(v)
}

function readParams(p: URLSearchParams) {
  const i = defaultInputs()
  for (const id of SLIDERS) {
    const raw = p.get(id)
    const r = A[id].range
    if (raw != null && r && !Number.isNaN(+raw)) i[id] = Math.min(r.max, Math.max(r.min, +raw))
  }
  const c: Case = p.get('case') === 'ceiling' ? 'ceiling' : 'conservative'
  const m: Move2Mode = p.get('move2') === 'standalone' ? 'standalone' : 'sequenced'
  return { i, c, m }
}

export default function Impact() {
  const { params } = useRoute()
  const init = useMemo(() => readParams(params), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [inputs, setInputs] = useState<Inputs>(init.i)
  const [c, setC] = useState<Case>(init.c)
  const [mode, setMode] = useState<Move2Mode>(init.m)
  const [drawer, setDrawer] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Only own the URL when shown as its own page (not inside the guided demo)
    if (!window.location.hash.startsWith('#/impact')) return
    const d = defaultInputs()
    const p = new URLSearchParams()
    if (c !== 'conservative') p.set('case', c)
    if (mode !== 'sequenced') p.set('move2', mode)
    for (const id of SLIDERS) if (inputs[id] !== d[id]) p.set(id, String(+inputs[id].toFixed(4)))
    setParams('/impact', p)
  }, [inputs, c, mode])

  const b = baseline(inputs)
  const res = combined(c, mode, inputs)
  const wf = waterfall(c, mode, inputs)
  const rc = rootCauses(inputs)
  const sens = sensitivity(mode, c, inputs)
  const upi = upiSwitch(inputs.upiDiscount, inputs)
  const net = networkIllustration(inputs)
  const lo = combined('conservative', mode, inputs)
  const hi = combined('ceiling', mode, inputs)
  const isDefault = SLIDERS.every((id) => inputs[id] === A[id].value)

  // Waterfall as stacked bars: invisible base + visible delta
  let run = 0
  const wfData = wf.map((s) => {
    if (s.kind === 'total') { run = s.value; return { ...s, base: 0, bar: s.value, color: COLORS.total } }
    const start = run
    run += s.value
    return { ...s, base: Math.min(start, run), bar: Math.abs(s.value), color: s.value < 0 ? COLORS.down : COLORS.up }
  })

  async function share() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setCopied(false) }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Surface 5 · Impact simulator"
        title="Every rupee, traced to an assumption you can move"
        lede={`Per 1 lakh orders. True drag counts only the ${rupees(inputs.reverseCost)} return leg, because the ${rupees(inputs.forwardCost)} forward leg is spent either way.`}
      />

      <div className="flex flex-wrap gap-3 items-center mb-6">
        <Segmented label="Case" value={c} onChange={setC} options={[{ value: 'conservative', label: 'Conservative' }, { value: 'ceiling', label: 'Ceiling (illustrative)' }]} />
        <Segmented label="Move 2 mode" value={mode} onChange={setMode} options={[{ value: 'sequenced', label: 'Move 2 sequenced' }, { value: 'standalone', label: 'Move 2 standalone' }]} />
        <button className="btn-ghost" onClick={() => setDrawer(true)} aria-haspopup="dialog">Assumptions ({Object.keys(A).length})</button>
        <button className="btn-plum" onClick={share}>{copied ? 'Link copied' : 'Share this scenario'}</button>
        {!isDefault && <button className="btn-ghost" onClick={() => setInputs(defaultInputs())}>Reset to deck values</button>}
      </div>

      {mode === 'standalone' && (
        <div className="mb-6"><Callout tone="warn"><strong>Standalone Move 2</strong> assumes resale acts on all {count(b.rtos)} RTOs. Combined with Move 1 this double-counts; use “sequenced” for the combined total.</Callout></div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mb-6" aria-live="polite">
        <div className="card lg:col-span-1 bg-plum text-cream">
          <p className="text-cream/90">Net saving{c === 'ceiling' ? ' (ceiling, illustrative)' : ''}</p>
          <p className="num text-5xl font-bold mt-1" data-testid="net">{lakh(res.net)}</p>
          <p className="mt-2 text-cream/90"><span className="num font-semibold text-cream">{pct(res.shareOfDrag)}</span> of the {lakh(b.trueDrag)} true drag</p>
          <p className="mt-3 text-sm text-cream/90">Range at these inputs: {lakh(lo.net)} to {lakh(hi.net)}</p>
        </div>
        <div className="card">
          <p className="text-ink-soft">Move 1 · reconfirm (net)</p>
          <p className="num text-3xl font-bold text-leaf-700">{lakh(res.m1.net, 2)}</p>
          <p className="mt-1 text-ink">{count(res.m1.orders)} RTOs prevented × {rupees(inputs.reverseCost)} = {lakh(res.m1.gross, 2)}, minus {lakh(res.m1.cost)} messaging + IVR.</p>
        </div>
        <div className="card">
          <p className="text-ink-soft">Move 2 · hub resale ({mode})</p>
          <p className="num text-3xl font-bold text-leaf-700">{lakh(res.m2.net)}</p>
          <p className="mt-1 text-ink">{count(res.m2.pool)} RTOs × {pct(res.m2.match)} match × {rupees(res.m2.perParcel)} per parcel.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mb-6">
        <section className="card" aria-labelledby="wf-h">
          <h2 id="wf-h" className="text-xl font-bold">Waterfall: from true drag to what is left</h2>
          <div className="mt-4 h-72" role="img" aria-label={`Waterfall: ${wf.map((s) => `${s.label} ${lakh(s.value)}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wfData} margin={{ top: 24, right: 8, left: 8, bottom: 8 }} barCategoryGap="22%">
                <XAxis dataKey="label" tick={{ fontSize: 13, fill: '#5C4756' }} interval={0} tickLine={false} axisLine={{ stroke: '#e5d6cf' }} />
                <YAxis hide domain={[0, b.trueDrag * 1.1]} />
                <Tooltip cursor={{ fill: 'rgba(90,15,71,.06)' }} formatter={(_v, _n, p) => [lakh((p.payload as { value: number }).value, 2), (p.payload as { label: string }).label]} labelFormatter={() => ''} />
                <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
                <Bar dataKey="bar" stackId="w" radius={[4, 4, 4, 4]} isAnimationActive={false}>
                  {wfData.map((d) => <Cell key={d.key} fill={d.color} />)}
                  <LabelList dataKey="value" position="top" formatter={(v: unknown) => lakh(Number(v), 2)} style={{ fill: '#2A1424', fontSize: 13, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 flex flex-wrap gap-4 text-sm text-ink">
            <li className="flex items-center gap-2"><span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: COLORS.total }} />Totals</li>
            <li className="flex items-center gap-2"><span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: COLORS.down }} />Saving</li>
            <li className="flex items-center gap-2"><span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: COLORS.up }} />Cost added</li>
          </ul>
        </section>

        <section className="card" aria-labelledby="g-h">
          <h2 id="g-h" className="text-xl font-bold">RTO rate (illustrative)</h2>
          <Gauge before={b.rtoRate} lo={hi.rtoRateAfter} hi={lo.rtoRateAfter} current={res.rtoRateAfter} />
          <p className="text-ink text-center">
            <span className="num font-bold">{pctTrim(b.rtoRate)}</span> today → <span className="num font-bold text-leaf-700">{pctTrim(lo.rtoRateAfter)}</span> conservative, <span className="num font-bold text-leaf-700">{pctTrim(hi.rtoRateAfter)}</span> ceiling
          </p>
          <p className="mt-2 text-sm text-ink-soft text-center">Only Move 1 changes the rate. Move 2 cuts the cost of failures that still happen.</p>
        </section>
      </div>

      <section className="card mb-6" aria-labelledby="sl-h">
        <h2 id="sl-h" className="text-xl font-bold">Move the assumptions</h2>
        <div className="mt-4 grid md:grid-cols-2 gap-x-8 gap-y-5">
          {SLIDERS.map((id) => {
            const a = A[id]; const r = a.range!
            return (
              <div key={id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor={`s-${id}`} className="font-semibold text-ink">{a.label}</label>
                  <span className="num font-bold text-plum">{fmt(id, inputs[id])}</span>
                </div>
                <input id={`s-${id}`} type="range" min={r.min} max={r.max} step={r.step} value={inputs[id]}
                  onChange={(e) => setInputs((x) => ({ ...x, [id]: +e.target.value }))}
                  aria-valuetext={fmt(id, inputs[id])}
                  className="mt-2 w-full accent-magenta h-6" />
                <div className="mt-1 flex items-center gap-2"><SourcePill tag={a.source} />{inputs[id] !== a.value && <span className="text-sm text-ink-soft">deck: {fmt(id, a.value)}</span>}</div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <section className="card" aria-labelledby="rc-h">
          <h2 id="rc-h" className="text-xl font-bold">Why parcels come back</h2>
          <p className="text-ink-soft">{count(b.rtos)} RTOs, {lakh(b.trueDrag)} true drag, split by an n={ROOT_CAUSE_SAMPLE} shopper survey. Illustrative.</p>
          <div className="mt-2"><SourcePill tag={ROOT_CAUSE_SOURCE} /></div>
          <div className="mt-3 h-64" role="img" aria-label={rc.map((r) => `${r.label} ${lakh(r.cost, 2)}`).join(', ')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rc} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }} barCategoryGap="20%">
                <XAxis type="number" hide domain={[0, 'dataMax']} />
                <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 14, fill: '#2A1424' }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(90,15,71,.06)' }} formatter={(v: unknown, _n, p) => [`${lakh(Number(v), 2)} · ${count((p.payload as { orders: number }).orders)} orders`, 'Cost']} />
                <Bar dataKey="cost" fill="#5A0F47" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  <LabelList dataKey="cost" position="right" formatter={(v: unknown) => lakh(Number(v), 2)} style={{ fill: '#2A1424', fontSize: 13, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer font-semibold text-plum">Show as table</summary>
            <table className="mt-2 w-full text-left">
              <thead className="text-sm text-ink-soft"><tr><th className="py-1">Cause</th><th>Share</th><th>Orders</th><th>Cost</th><th className="hidden sm:table-cell">Fixed by</th></tr></thead>
              <tbody>
                {rc.map((r) => <tr key={r.id} className="border-t border-plum/10"><td className="py-1.5">{r.label}</td><td className="num">{pct(r.share)}</td><td className="num">{count(r.orders)}</td><td className="num">{lakh(r.cost, 2)}</td><td className="hidden sm:table-cell">{r.fixedBy}</td></tr>)}
                <tr className="border-t-2 border-plum font-bold"><td className="py-1.5">Total</td><td className="num">{pct(rc.reduce((s, r) => s + r.share, 0))}</td><td className="num">{count(rc.reduce((s, r) => s + r.orders, 0))}</td><td className="num">{lakh(rc.reduce((s, r) => s + r.cost, 0))}</td><td className="hidden sm:table-cell" /></tr>
              </tbody>
            </table>
          </details>
        </section>

        <div className="space-y-6">
          <section className="card" aria-labelledby="sens-h">
            <h2 id="sens-h" className="text-xl font-bold">Sensitivity: resale match rate</h2>
            <p className="text-ink-soft">Move 2 {mode}, {c} case. The pilot exists to measure this number.</p>
            <table className="mt-3 w-full text-left">
              <thead className="text-sm text-ink-soft"><tr><th className="py-1">Match rate</th><th>Parcels resold</th><th>Move 2 net</th><th>Combined net</th></tr></thead>
              <tbody>
                {sens.map((s) => (
                  <tr key={s.match} className={`border-t border-plum/10 ${Math.abs(s.match - A.m2Match.value) < 1e-9 ? 'font-bold bg-plum-100/50' : ''}`}>
                    <td className="py-2 num">{pct(s.match)}</td><td className="num">{count(s.parcels)}</td><td className="num">{lakh(s.net)}</td><td className="num">{lakh(res.m1.net + s.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card" aria-labelledby="upi-h">
            <h2 id="upi-h" className="text-xl font-bold">COD → UPI switch, per order</h2>
            <p className="mt-2 text-ink">{pct(upi.points)} lower RTO risk × {rupees(inputs.reverseCost)} = <strong className="num">{rupees(upi.expectedSaving)}</strong> expected saving.</p>
            <p className="mt-1 text-ink">Minus a {rupees(inputs.upiDiscount)} discount = <strong className={`num ${upi.net < 0 ? 'text-magenta-600' : 'text-leaf-700'}`}>{upi.net < 0 ? '' : '+'}{rupees(upi.net)}</strong> net.</p>
            <p className="mt-2 text-sm text-ink-soft">Not in the totals above. At {rupees(A.upiDiscount.value)} the incentive is slightly negative; at {rupees(A.upiDiscountAlt.value)} it pays {rupees(upiSwitch(A.upiDiscountAlt.value, inputs).net)}.</p>
          </section>

          <section className="card" aria-labelledby="dist-h">
            <h2 id="dist-h" className="text-xl font-bold">Distance gradient</h2>
            <ul className="mt-3 space-y-2">
              {distanceGradient(inputs).map((d) => (
                <li key={d.band} className="flex items-center gap-3">
                  <span className="w-20 text-ink">{d.band}</span>
                  <span className="flex-1 h-3 rounded bg-cream-200" aria-hidden><span className="block h-3 rounded bg-plum" style={{ width: `${(d.rate / 0.25) * 100}%` }} /></span>
                  <span className="num font-semibold">{pct(d.rate)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2"><SourcePill tag="case" /></div>
          </section>
        </div>
      </div>

      <section className="rounded-xl2 border-2 border-dashed border-plum/30 p-5 mb-6" aria-labelledby="net-h">
        <p className="chip bg-coral-100 text-plum">Upper-bound illustration, not a forecast</p>
        <h2 id="net-h" className="mt-2 text-lg font-bold font-sans text-ink">If the per-lakh range held across the whole network</h2>
        <p className="mt-1 text-ink">
          Scaling to {count(inputs.networkOrdersFY25 / 1e6)}M Valmo orders (FY25, desk research based on the Meesho IPO prospectus) gives about ₹{net.lowCr}–{net.highCr} Cr a year.
        </p>
        <p className="mt-1 text-ink-soft">Caveat: assumes every order mix, hub and pincode behaves like the pilot. It will not. Treat it as a ceiling for sizing, not a target.</p>
      </section>

      <section className="card" aria-labelledby="open-h">
        <h2 id="open-h" className="text-xl font-bold">Still open</h2>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-ink">{OPEN_ITEMS.map((o) => <li key={o}>{o}</li>)}</ul>
      </section>

      <AssumptionsDrawer open={drawer} onClose={() => setDrawer(false)} inputs={inputs} />
    </div>
  )
}

function Gauge({ before, lo, hi, current }: { before: number; lo: number; hi: number; current: number }) {
  const max = 0.25
  const ang = (v: number) => Math.PI * (1 - Math.min(v, max) / max)
  const pt = (v: number, r: number) => [100 + r * Math.cos(ang(v)), 100 - r * Math.sin(ang(v))]
  const arc = (a: number, b: number, r: number) => {
    const [x1, y1] = pt(a, r), [x2, y2] = pt(b, r)
    return `M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}`
  }
  const [nx, ny] = pt(current, 62)
  const [bx, by] = pt(before, 86)
  return (
    <svg viewBox="0 0 200 116" className="mx-auto mt-2 w-full max-w-xs" aria-hidden>
      <path d={arc(0, max, 80)} stroke="#F4E6D2" strokeWidth="16" fill="none" strokeLinecap="round" />
      <path d={arc(lo, hi, 80)} stroke="#2F8F5B" strokeWidth="16" fill="none" />
      <circle cx={bx} cy={by} r="5" fill="#C2186B" />
      <motion.line x1="100" y1="100" initial={false} animate={{ x2: nx, y2: ny }} stroke="#5A0F47" strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="100" r="6" fill="#5A0F47" />
      <text x="20" y="114" fontSize="10" fill="#5C4756" textAnchor="middle">0%</text>
      <text x="180" y="114" fontSize="10" fill="#5C4756" textAnchor="middle">25%</text>
    </svg>
  )
}

function AssumptionsDrawer({ open, onClose, inputs }: { open: boolean; onClose: () => void; inputs: Inputs }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); prev?.focus() }
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-ink/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div ref={ref} role="dialog" aria-modal="true" aria-labelledby="as-h" tabIndex={-1}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto bg-cream p-5 shadow-card outline-none"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25 }}>
            <div className="flex items-center justify-between">
              <h2 id="as-h" className="text-2xl font-bold">Assumptions</h2>
              <button className="btn-ghost min-h-[40px]" onClick={onClose}>Close</button>
            </div>
            <p className="mt-1 text-ink-soft">Every number on this site comes from this list (src/data/assumptions.ts).</p>
            <ul className="mt-4 space-y-3">
              {(Object.keys(A) as AssumptionId[]).map((id) => (
                <li key={id} className="rounded-xl bg-white p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-ink">{A[id].label}</span>
                    <span className="num font-bold text-plum">{fmt(id, inputs[id])}</span>
                  </div>
                  <div className="mt-1"><SourcePill tag={A[id].source} /></div>
                  {A[id].note && <p className="mt-1 text-sm text-ink-soft">{A[id].note}</p>}
                </li>
              ))}
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
