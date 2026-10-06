import { useState } from 'react'
import { PageHeader, Callout, SourcePill, Segmented } from '../components/ui'
import { riskFactors, orderRisk, approxPct, factor, pct, type Band } from '../lib/model'
import { A } from '../data/assumptions'

const f = riskFactors()
const BANDS: Band[] = ['near', 'moderate', 'far']

export default function Risk() {
  const [cod, setCod] = useState<'cod' | 'prepaid'>('cod')
  const [band, setBand] = useState<Band>('far')
  const [first, setFirst] = useState(false)
  const r = orderRisk({ cod: cod === 'cod', band, firstAddress: first })

  return (
    <div>
      <PageHeader
        eyebrow="Why this score"
        title="Risk = payment mode × distance tier"
        lede="One sentence: each order's estimated RTO is the blended rate, scaled by how much riskier its payment mode and its distance tier are than average, using only the case data pack's own rates."
      />
      <Callout tone="warn">
        <p data-testid="risk-disclaimer">
          <strong>Illustrative, not tested against real outcomes.</strong> The weights were fitted to two marginal rates only: RTO by payment mode
          ({pct(A.codRto.value)} COD, {pct(A.prepaidRto.value)} prepaid) and RTO by distance tier ({pct(A.rtoNear.value)} / {pct(A.rtoModerate.value)} / {pct(A.rtoFar.value)}).
          It assumes the two effects multiply. First-time address has no rate in the case pack, so it is shown as a flag and never scored.
        </p>
      </Callout>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <section aria-labelledby="w-h" className="card">
          <h2 id="w-h" className="text-xl font-bold">The weight table</h2>
          <p className="text-ink-soft">Each factor is that group's RTO rate divided by the blended {pct(f.blended)}.</p>
          <table className="mt-3 w-full text-left" data-testid="weights">
            <thead className="text-sm text-ink-soft"><tr><th className="py-1">Input</th><th>Group rate</th><th>Factor</th><th>Source</th></tr></thead>
            <tbody>
              <tr className="border-t border-plum/10"><td className="py-2">COD</td><td className="num">{pct(A.codRto.value)}</td><td className="num font-semibold">{factor(f.pay.cod)}</td><td><SourcePill tag="case" /></td></tr>
              <tr className="border-t border-plum/10"><td className="py-2">Prepaid</td><td className="num">{pct(A.prepaidRto.value)}</td><td className="num font-semibold">{factor(f.pay.prepaid)}</td><td><SourcePill tag="case" /></td></tr>
              {BANDS.map((b) => (
                <tr key={b} className="border-t border-plum/10"><td className="py-2 capitalize">{b} distance</td><td className="num">{pct(b === 'near' ? A.rtoNear.value : b === 'moderate' ? A.rtoModerate.value : A.rtoFar.value)}</td><td className="num font-semibold">{factor(f.band[b])}</td><td><SourcePill tag="case" /></td></tr>
              ))}
              <tr className="border-t border-plum/10"><td className="py-2">First-time address</td><td>—</td><td className="font-semibold">flag only</td><td><SourcePill tag="assumption" /></td></tr>
            </tbody>
          </table>
        </section>

        <section aria-labelledby="t-h" className="card" aria-live="polite">
          <h2 id="t-h" className="text-xl font-bold">Try an order</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Segmented label="Payment mode" value={cod} onChange={setCod} options={[{ value: 'cod', label: 'COD' }, { value: 'prepaid', label: 'Prepaid' }]} />
            <Segmented label="Distance tier" value={band} onChange={setBand} options={BANDS.map((b) => ({ value: b, label: b[0].toUpperCase() + b.slice(1) }))} />
          </div>
          <label className="mt-3 flex items-center gap-3">
            <input type="checkbox" checked={first} onChange={(e) => setFirst(e.target.checked)} className="h-5 w-5 accent-plum" />
            <span className="text-ink">First-time address</span>
          </label>
          <p className="mt-4 text-ink-soft">Estimated RTO</p>
          <p className="num text-4xl font-bold text-plum" data-testid="risk-value">{approxPct(r.est)}</p>
          <p className="text-ink" data-testid="risk-why">
            {pct(f.blended)} × {factor(r.payFactor)} ({cod === 'cod' ? 'COD' : 'prepaid'}) × {factor(r.bandFactor)} ({band} distance), rounded to the nearest percent: <strong>{r.tier}</strong>.
          </p>
          {r.flags.length > 0 && <p className="mt-2 chip bg-white text-ink border border-plum/20" data-testid="risk-flag">{r.flags[0]}</p>}
        </section>
      </div>
    </div>
  )
}
