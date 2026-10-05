import { baseline, combined, lakh, pct, pctTrim, count } from '../lib/model'
import { SURFACES } from '../data/surfaces'
import { VerifyCard } from '../components/VerifyCard'

const b = baseline()
const lo = combined('conservative')
const hi = combined('ceiling')


export default function Landing() {
  const three = SURFACES.filter((s) => ['customer', 'rider', 'resale'].includes(s.id))
  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center">
        <div>
          <p className="eyebrow">Meesho DICE S3 · Reducing RTO</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-bold leading-tight">
            Get the parcel to a yes <span className="text-magenta">before</span> it leaves the hub.
          </h1>
          <p className="mt-4 text-lg text-ink-soft max-w-xl">
            Route Cause asks the customer first, checks every failed attempt, and resells refused parcels locally. Here is the 60-second judge's path.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#/demo" className="btn-primary text-lg">▶ Play the demo</a>
            <a href="#/impact" className="btn-ghost">Open the impact model</a>
          </div>
        </div>
        <VerifyCard />
      </section>

      <section className="animate-rise" style={{ animationDelay: '80ms' }} aria-labelledby="p-h">
        <p className="eyebrow">1 · The problem</p>
        <h2 id="p-h" className="mt-1 text-3xl font-bold">{pctTrim(b.rtoRate)} of orders come back. Each one burns a return trip.</h2>
        <div className="mt-5 grid sm:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-ink-soft">RTOs per 1 lakh orders</p>
            <p className="num text-4xl font-bold text-plum mt-1">{count(b.rtos)}</p>
          </div>
          <div className="card">
            <p className="text-ink-soft">True incremental drag</p>
            <p className="num text-4xl font-bold text-plum mt-1">{lakh(b.trueDrag)}</p>
            <p className="text-sm text-ink-soft mt-1">Return leg only. Gross with the forward leg is {lakh(b.grossCost)}.</p>
          </div>
          <div className="card">
            <p className="text-ink-soft">COD vs prepaid RTO</p>
            <p className="num text-4xl font-bold text-magenta-600 mt-1">{b.codGap.toFixed(1)}×</p>
            <p className="text-sm text-ink-soft mt-1">COD drives {lakh(b.codExcessCost)} of the {lakh(b.trueDrag)}.</p>
          </div>
        </div>
      </section>

      <section className="animate-rise" style={{ animationDelay: '160ms' }} aria-labelledby="s-h">
        <p className="eyebrow">2 · Three surfaces, one loop</p>
        <h2 id="s-h" className="mt-1 text-3xl font-bold">Ask early. Verify the attempt. Resell nearby.</h2>
        <ol className="mt-5 grid md:grid-cols-3 gap-4">
          {three.map((s, n) => (
            <li key={s.id}>
              <a href={`#${s.path}`} className="card block h-full hover:ring-2 hover:ring-magenta/40 transition">
                <span className="chip bg-plum-100 text-plum">Step {n + 1} · {s.who}</span>
                <h3 className="mt-3 text-2xl font-bold">{s.label}</h3>
                <p className="mt-2 text-ink-soft">{s.blurb}</p>
                <span className="mt-3 inline-block font-semibold text-magenta-600">Open →</span>
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-ink-soft">
          Also: the <a className="underline text-plum font-semibold" href="#/hub">hub control tower</a> and the{' '}
          <a className="underline text-plum font-semibold" href="#/pilot">pilot plan</a>.
        </p>
      </section>

      <section style={{ animationDelay: '240ms' }} aria-labelledby="i-h" className="animate-rise card bg-plum-100/60">
        <p className="eyebrow">3 · Impact (sequenced, per 1 lakh orders)</p>
        <h2 id="i-h" className="mt-1 text-3xl font-bold">
          {lakh(lo.net)} to {lakh(hi.net)} net saved, {pct(lo.shareOfDrag)} to {pct(hi.shareOfDrag)} of the drag.
        </h2>
        <p className="mt-3 text-lg text-ink-soft max-w-3xl">
          Illustrative RTO falls from {pctTrim(lo.rtoRateBefore)} to {pctTrim(lo.rtoRateAfter)} (conservative), with a ceiling of {pctTrim(hi.rtoRateAfter)}. Resale does not change the RTO rate; it cuts the cost of the failures that still happen.
        </p>
        <a href="#/impact" className="btn-plum mt-5">Move the assumptions yourself →</a>
      </section>
    </div>
  )
}
