import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PageHeader, Callout } from '../components/ui'
import { Phone } from '../components/Phone'
import { RESALE_ITEM, BUYERS, HUB, DEMO_TODAY } from '../data/scenario'
import { resaleChecks, move2PerParcel, resalePrice, addBusinessDays, rupees, defaultInputs, type ResaleItem } from '../lib/model'
import { OPEN_ITEMS } from '../data/assumptions'

const inputs = defaultInputs()
const STEPS = ['Refused at the door', 'Hub eligibility check', 'Match nearby buyers', 'New order + invoice', 'Next-day local delivery'] as const

export default function Resale() {
  const [step, setStep] = useState(0)
  const [item, setItem] = useState<ResaleItem>({ ...RESALE_ITEM })
  const checks = resaleChecks(item)
  const per = move2PerParcel()
  const price = resalePrice(RESALE_ITEM.price)
  const best = BUYERS.find((b) => !b.sameDevice)!
  const deadline = addBusinessDays(DEMO_TODAY, inputs.m2WindowDays)
  const blocked = step >= 2 && !checks.eligible

  const toggle = (k: keyof ResaleItem) => setItem((x) => ({ ...x, [k]: typeof x[k] === 'boolean' ? !x[k] : x[k] }))
  const FLIP: Record<string, keyof ResaleItem> = { perishable: 'perishable', personalised: 'personalised', seal: 'sealIntact', photo: 'photoLogged', match: 'sizeColourMatch' }

  return (
    <div>
      <PageHeader
        eyebrow="Surface 4 · Hub resale · Move 2"
        title="A refused parcel becomes a nearby sale"
        lede={`Instead of a ${rupees(inputs.reverseCost)} trip back to the seller, an eligible parcel is offered to a buyer near the hub and delivered the next day.`}
      />

      <ol className="flex flex-wrap gap-2 mb-6" aria-label="Resale steps">
        {STEPS.map((s, n) => (
          <li key={s}>
            <button onClick={() => setStep(n)} aria-current={step === n ? 'step' : undefined}
              className={`chip min-h-[40px] ${step === n ? 'bg-plum text-cream' : n < step ? 'bg-leaf-100 text-leaf-700' : 'bg-white text-plum'}`}>
              {n + 1}. {s}
            </button>
          </li>
        ))}
      </ol>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.section key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }} className="card" aria-live="polite">
              <p className="eyebrow">Step {step + 1} of {STEPS.length}</p>
              <h2 className="mt-1 text-2xl font-bold">{STEPS[step]}</h2>

              {step === 0 && (
                <p className="mt-3 text-lg text-ink">
                  Order {RESALE_ITEM.id}, {RESALE_ITEM.name}, {rupees(RESALE_ITEM.price)}. The customer changed their mind at the door. The rider scans “refused” and the parcel returns to {HUB.name} hub the same evening.
                </p>
              )}

              {step === 1 && (
                <>
                  <p className="mt-2 text-ink-soft">Tap a check to see what happens when it fails.</p>
                  <ul className="mt-3 space-y-2">
                    {checks.checks.map((c) => (
                      <li key={c.id}>
                        <button disabled={!FLIP[c.id]} onClick={() => FLIP[c.id] && toggle(FLIP[c.id])}
                          className={`w-full text-left flex items-center gap-3 rounded-xl p-3 border ${c.pass ? 'border-leaf/40 bg-leaf-100' : 'border-coral bg-coral-100'} disabled:cursor-default`}>
                          <span aria-hidden className={`grid place-items-center h-7 w-7 rounded-full font-bold ${c.pass ? 'bg-leaf-700 text-white' : 'bg-magenta text-white'}`}>{c.pass ? '✓' : '✕'}</span>
                          <span className="text-ink font-semibold">{c.id === 'cap' ? `Value ${rupees(item.price)} is under the ${rupees(inputs.m2PriceCap)} cap` : c.label}</span>
                          <span className="sr-only">{c.pass ? 'passes' : 'fails'}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className={`mt-4 font-semibold ${checks.eligible ? 'text-leaf-700' : 'text-magenta-600'}`} role="status">
                    {checks.eligible ? 'Eligible for local resale.' : 'Not eligible: goes back to the seller as a standard RTO.'}
                  </p>
                </>
              )}

              {step === 2 && (blocked ? <Blocked /> : (
                <>
                  <p className="mt-2 text-ink">People in the same pincode cluster who viewed or wishlisted this item.</p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left">
                      <caption className="sr-only">Candidate buyers</caption>
                      <thead className="text-sm text-ink-soft"><tr><th className="py-2 px-2">Buyer</th><th className="px-2">Distance</th><th className="px-2">Signal</th><th className="px-2">Device check</th></tr></thead>
                      <tbody>
                        {BUYERS.map((b) => (
                          <tr key={b.id} className={`border-t border-plum/10 ${b.id === best.id ? 'bg-leaf-100 font-semibold' : ''} ${b.sameDevice ? 'text-magenta-600' : ''}`}>
                            <td className="py-2.5 px-2">{b.label}{b.id === best.id && ' ★'}</td>
                            <td className="px-2 num">{b.km} km</td>
                            <td className="px-2">{b.signal}</td>
                            <td className="px-2">{b.sameDevice ? 'Same device as original buyer: blocked' : 'Different device: pass'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-ink-soft">The same-device rule stops a customer refusing a parcel and then rebuying it at the discount.</p>
                </>
              ))}

              {step === 3 && (blocked ? <Blocked /> : (
                <div className="mt-3 grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border-2 border-dashed border-plum/30 p-4 font-mono text-sm bg-cream">
                    <p className="font-bold">TAX INVOICE (auto-generated mock)</p>
                    <p>Order {RESALE_ITEM.newId}</p>
                    <p>{best.label}, {best.km} km from hub</p>
                    <p>{RESALE_ITEM.name}</p>
                    <p>Price {rupees(RESALE_ITEM.price)} − {rupees(inputs.m2BuyerDiscount)} clearance = {rupees(price)}</p>
                    <p>Ship from: {HUB.name} hub</p>
                  </div>
                  <div className="space-y-2 text-ink">
                    <p>The system creates the new order and the invoice. <strong>The hub only prints it and affixes the label.</strong></p>
                    <p>Original order {RESALE_ITEM.id} closes as “refused, resold”.</p>
                    <Callout tone="warn">Open: {OPEN_ITEMS[0]}</Callout>
                  </div>
                </div>
              ))}

              {step === 4 && (blocked ? <Blocked /> : (
                <div className="mt-3 space-y-3 text-ink">
                  <p className="text-lg">Delivered next day by the local last-mile leg ({rupees(inputs.lmdcLeg)}, case data pack).</p>
                  <p>No match by <strong>{deadline.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</strong> ({inputs.m2WindowDays} business days)? The parcel reverts to standard RTO, well inside Meesho's {inputs.returnPolicyDays}-day return policy.</p>
                </div>
              ))}

              <div className="mt-6 flex gap-3">
                <button className="btn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
                <button className="btn-primary" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={step === STEPS.length - 1}>Next step</button>
              </div>
            </motion.section>
          </AnimatePresence>

          <section aria-labelledby="pp-h" className="card">
            <h2 id="pp-h" className="text-xl font-bold">What one resold parcel is worth</h2>
            <table className="mt-3 w-full text-[16px]">
              <tbody>
                <tr><td className="py-1.5">Return leg avoided</td><td className="text-right num">{rupees(per.avoided)}</td></tr>
                <tr><td className="py-1.5">Hub handling ({rupees(inputs.lmdcLeg)} LMDC leg + {rupees(inputs.m2Rebag)} re-bagging)</td><td className="text-right num">{rupees(-per.handling)}</td></tr>
                <tr><td className="py-1.5">Buyer discount</td><td className="text-right num">{rupees(-per.discount)}</td></tr>
                <tr className="border-t-2 border-plum font-bold text-leaf-700"><td className="py-2">Net per parcel</td><td className="text-right num text-xl">{rupees(per.net)}</td></tr>
              </tbody>
            </table>
            <a className="mt-3 inline-block font-semibold text-magenta-600 underline" href="#/impact">See it at scale in the impact model →</a>
          </section>
        </div>

        <aside className="space-y-6">
          <Phone label="Buyer app: Clearance near you (mock)">
            <div className="bg-white px-4 pt-9 pb-3 border-b"><p className="font-semibold text-ink">Clearance near you</p><p className="text-sm text-ink-soft">Ships from a hub 0.8 km away</p></div>
            <div className="flex-1 bg-[#F5F1F4] p-3 space-y-3">
              <div className="rounded-xl bg-white p-3">
                <div aria-hidden className="h-36 rounded-lg bg-magenta-100 grid place-items-center text-5xl">👟</div>
                <p className="mt-2 font-semibold text-ink">{RESALE_ITEM.name}</p>
                <p className="text-ink"><span className="num text-xl font-bold text-plum">{rupees(price)}</span> <s className="text-ink-soft">{rupees(RESALE_ITEM.price)}</s></p>
                <p className="text-sm text-leaf-700 font-semibold">Delivered tomorrow · sealed and checked at hub</p>
                <button className="mt-2 w-full min-h-[44px] rounded-lg bg-magenta text-white font-semibold">Buy now</button>
              </div>
            </div>
          </Phone>
          <section aria-labelledby="seller-h" className="card">
            <h2 id="seller-h" className="text-xl font-bold">Seller view</h2>
            <p className="text-ink-soft">{RESALE_ITEM.seller}</p>
            <label className="mt-3 flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-5 w-5 accent-plum" />
              <span className="text-ink">Opt in: let hubs resell my refused parcels locally</span>
            </label>
            <dl className="mt-3 space-y-1 text-ink">
              <div className="flex flex-wrap justify-between gap-x-3"><dt>Payout for {RESALE_ITEM.newId}</dt><dd className="font-semibold">Normal settlement</dd></div>
              <div className="flex flex-wrap justify-between gap-x-3"><dt>Return-to-origin charge</dt><dd className="font-semibold text-leaf-700">None</dd></div>
            </dl>
            <p className="mt-2 text-sm text-ink-soft">It is a new sale, not a return, so the seller is paid as usual.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}

function Blocked() {
  return <p className="mt-3 text-lg text-magenta-600 font-semibold">The eligibility check failed, so this parcel takes the standard RTO route. Go back to step 2 to fix it.</p>
}
