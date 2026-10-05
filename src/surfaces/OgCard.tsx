import { baseline, combined, lakh, pct, pctTrim } from '../lib/model'

/** 1200x630 share image, rendered to public/og.png by scripts/gen-images.mjs. Not linked in the UI. */
export default function OgCard() {
  const b = baseline()
  const lo = combined('conservative')
  const hi = combined('ceiling')
  return (
    <div className="w-[1200px] h-[630px] bg-cream p-16 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <p className="font-display text-4xl font-bold text-plum">Meesho <span className="text-coral">×</span> Valmo · Route Cause</p>
        <span className="chip bg-coral-100 text-plum border border-coral text-xl px-5 py-2">Prototype: simulated data</span>
      </div>
      <div>
        <p className="font-display text-7xl font-bold text-plum leading-tight">Get the parcel to a yes <span className="text-magenta">before</span> it leaves the hub.</p>
        <p className="mt-6 text-3xl text-ink">
          Illustrative: {lakh(lo.net)}–{lakh(hi.net)} net saved per lakh orders, {pct(lo.shareOfDrag)}–{pct(hi.shareOfDrag)} of the RTO drag. RTO {pctTrim(b.rtoRate)} → {pctTrim(lo.rtoRateAfter)} (conservative).
        </p>
      </div>
      <p className="text-2xl text-ink-soft">Meesho DICE S3 · Reducing RTO · interactive prototype, code and tests</p>
    </div>
  )
}
