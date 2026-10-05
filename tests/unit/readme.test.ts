import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  baseline, move1, move2, combined, upiSwitch, move2PerParcel, networkIllustration, pilotPower, pilotSizing,
  pincodesNeeded, lakh, pct, pctTrim, rupees, count, defaultInputs,
} from '../../src/lib/model'
import { A, PILOT_REFERENCE_SHIFT } from '../../src/data/assumptions'

// The README's headline table must say exactly what the model computes.
const readme = readFileSync('README.md', 'utf8')
const i = defaultInputs()
const b = baseline()
const lo = combined('conservative')
const hi = combined('ceiling')
const pp = pilotPower()
const pins3 = pincodesNeeded(pp.p1, pp.p1 - PILOT_REFERENCE_SHIFT, { ordersPerPinWeek: i.pilotOrdersPerPinWeek, weeks: pilotSizing().weeks, icc: i.pilotIcc })
const net = networkIllustration()

const expected: [string, string][] = [
  ['blended RTO', `**${pctTrim(b.rtoRate)}** = ${count(b.rtos)} RTOs`],
  ['true drag and gross', `**${lakh(b.trueDrag)}** (${lakh(b.grossCost)} gross)`],
  ['COD gap', `**${b.codGap.toFixed(1)}×**`],
  ['Move 1', `**${lakh(move1('conservative').net, 2)}** conservative, **${lakh(move1('ceiling').net, 2)}** ceiling`],
  ['Move 1 cost', `net of ${lakh(move1('conservative').cost)} messaging + IVR`],
  ['Move 2 per parcel', `${rupees(move2PerParcel().net)} net per resold parcel`],
  ['Move 2 sequenced', `**${lakh(move2('sequenced', 'conservative').net)}** conservative, **${lakh(move2('sequenced', 'ceiling').net)}** ceiling`],
  ['combined', `**${lakh(lo.net)}–${lakh(hi.net)}** net = **${pct(lo.shareOfDrag)}–${pct(hi.shareOfDrag)}** of the true drag`],
  ['RTO after', `${pctTrim(lo.rtoRateBefore)} → **${pctTrim(lo.rtoRateAfter)}** conservative, **${pctTrim(hi.rtoRateAfter)}** ceiling`],
  ['UPI', `**${rupees(upiSwitch(i.upiDiscount).expectedSaving)}** expected saving per switch: **${rupees(upiSwitch(i.upiDiscount).net)}** net at a ${rupees(i.upiDiscount)} discount, **+${rupees(upiSwitch(A.upiDiscountAlt.value).net)}** at ${rupees(A.upiDiscountAlt.value)}`],
  ['pilot design', `the ${i.pilotPincodesTreated} highest-RTO pincodes vs ${i.pilotPincodesControl} matched controls, ${i.pilotOrdersPerPinWeek} orders/pincode/week, ${pilotSizing().weeks} weeks, ICC ${i.pilotIcc}`],
  ['pilot MDE', `Detects a drop of about **${(pp.mde * 100).toFixed(1)} points**. A ${PILOT_REFERENCE_SHIFT * 100}-point shift would need about **${pins3}** pincodes per arm`],
  ['network', `${count(i.networkOrdersFY25 / 1e6)}M orders, FY25) | About **₹${net.lowCr}–${net.highCr} Cr/year**: an upper-bound illustration, **not a forecast**`],
  ['rider fee placeholder', `the ${rupees(i.riderAttemptFee)} rider attempt fee. The rider fee is a placeholder and feeds no headline number`],
]

describe('README headline numbers match the model', () => {
  for (const [name, text] of expected) {
    it(name, () => expect(readme).toContain(text))
  }
  it('has the live URL and the demo path', () => {
    expect(readme).toContain('https://valmo-jet.vercel.app')
    expect(readme).toContain('valmo-jet.vercel.app/#/demo')
  })
  it('contains no preview URLs, Vercel IDs or team slugs', () => {
    expect(readme).not.toMatch(/joshuas-projects|prj_|team_|vercel\.app\/.*-git-/)
  })
})
