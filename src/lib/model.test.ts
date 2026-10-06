import { describe, it, expect } from 'vitest'
import {
  baseline, distanceGradient, rootCauses, move1, upiSwitch, replyValue, move2PerParcel,
  move2, sensitivity, combined, networkIllustration, waterfall, validateUnavailable,
  riderPremium, resaleChecks, pilotSizing, pilotPower, scenarioEffects, messagingCostPerOrder, normInv, twoPropN, designEffect, mde, weeksNeeded, pincodesNeeded, addBusinessDays, lakh, pctTrim, defaultInputs,
} from './model'
import { A, ROOT_CAUSES } from '../data/assumptions'

const L = (n: number) => lakh(n)

describe('Baseline, per 1 lakh orders', () => {
  const b = baseline()
  it('blended RTO is 17% (80% COD x 20% + 20% prepaid x 5%) = 17,000 RTOs', () => {
    expect(b.rtoRate).toBeCloseTo(0.17, 10)
    expect(b.rtos).toBe(17_000)
  })
  it('forward Rs 50 + reverse Rs 120 = gross Rs 170 per RTO', () => {
    expect(A.forwardCost.value).toBe(50)
    expect(A.reverseCost.value).toBe(120)
    expect(b.grossPerRto).toBe(170)
  })
  it('gross cost is Rs 28.9L', () => {
    expect(b.grossCost).toBe(2_890_000)
    expect(L(b.grossCost)).toBe('₹28.9L')
  })
  it('true incremental drag (x Rs 120 only) is Rs 20.4L', () => {
    expect(b.trueDrag).toBe(2_040_000)
    expect(L(b.trueDrag)).toBe('₹20.4L')
  })
  it('baseline 5,000 orders = Rs 6.0L; COD excess 12,000 orders = Rs 14.4L', () => {
    expect(b.baselineOrders).toBe(5_000)
    expect(L(b.baselineCost)).toBe('₹6.0L')
    expect(b.codExcessOrders).toBeCloseTo(12_000, 6)
    expect(L(b.codExcessCost)).toBe('₹14.4L')
    expect(b.baselineCost + b.codExcessCost).toBeCloseTo(b.trueDrag, 6)
  })
  it('COD vs prepaid gap is 4.0x', () => {
    expect(b.codGap.toFixed(1)).toBe('4.0')
  })
})

describe('Distance gradient', () => {
  it('is 15% / 17% / 22% (near / moderate / far)', () => {
    expect(distanceGradient().map((d) => d.rate)).toEqual([0.15, 0.17, 0.22])
  })
})

describe('Root-cause split (n=20, illustrative)', () => {
  const rc = rootCauses()
  it('shares are 20/20/15/15/15/15 and sum to 1', () => {
    expect(ROOT_CAUSES.map((c) => c.share)).toEqual([0.2, 0.2, 0.15, 0.15, 0.15, 0.15])
    expect(ROOT_CAUSES.reduce((s, c) => s + c.share, 0)).toBeCloseTo(1, 12)
  })
  it('costs are Rs 4.08L, 4.08L, 3.06L, 3.06L, 3.06L, 3.06L', () => {
    expect(rc.map((c) => lakh(c.cost, 2))).toEqual(['₹4.08L', '₹4.08L', '₹3.06L', '₹3.06L', '₹3.06L', '₹3.06L'])
  })
  it('sum to 17,000 orders and exactly Rs 20.4L', () => {
    expect(rc.reduce((s, c) => s + c.orders, 0)).toBeCloseTo(17_000, 6)
    expect(rc.reduce((s, c) => s + c.cost, 0)).toBeCloseTo(2_040_000, 6)
  })
})

describe('Move 1: reconfirmation (Rs 120 basis)', () => {
  it('conservative: 40% x 50% = 20% = 3,400 orders = Rs 4.08L gross - Rs 1.2L = Rs 2.88L net', () => {
    const m = move1('conservative')
    expect(m.rate).toBeCloseTo(0.2, 12)
    expect(m.orders).toBeCloseTo(3_400, 6)
    expect(m.gross).toBeCloseTo(408_000, 6)
    expect(m.cost).toBe(120_000)
    expect(m.net).toBeCloseTo(288_000, 6)
    expect(lakh(m.net, 2)).toBe('₹2.88L')
  })
  it('ceiling: 55% (definitely + half of maybe) = 9,350 orders = Rs 11.22L gross - Rs 1.2L = Rs 10.02L net', () => {
    const m = move1('ceiling')
    expect(m.rate).toBeCloseTo(0.55, 12)
    expect(m.orders).toBeCloseTo(9_350, 6)
    expect(lakh(m.gross, 2)).toBe('₹11.22L')
    expect(m.cost).toBe(120_000)
    expect(lakh(m.net, 2)).toBe('₹10.02L')
  })
  it('never uses the Rs 170 basis', () => {
    const m = move1('conservative')
    expect(m.gross / m.orders).toBe(120)
  })
})

describe('UPI switch', () => {
  it('expected saving = 15 points x Rs 120 = Rs 18', () => {
    const u = upiSwitch(20)
    expect(u.points).toBeCloseTo(0.15, 12)
    expect(u.expectedSaving).toBeCloseTo(18, 10)
  })
  it('net of a Rs 20 discount is -Rs 2 (slightly negative)', () => {
    expect(upiSwitch(20).net).toBeCloseTo(-2, 10)
  })
  it('net of a Rs 10 discount is +Rs 8', () => {
    expect(upiSwitch(A.upiDiscountAlt.value).net).toBeCloseTo(8, 10)
  })
})

describe('Per-response value in the customer flow', () => {
  it('Confirm the slot = Rs 0 counted', () => {
    expect(replyValue('confirm')).toMatchObject({ amount: 0, kind: 'counted' })
  })
  it('Switch COD -> UPI = Rs 18 expected', () => {
    const v = replyValue('upi')
    expect(v.kind).toBe('expected')
    expect(v.amount).toBeCloseTo(18, 10)
  })
  it('Cancel before dispatch = up to Rs 170', () => {
    expect(replyValue('cancel')).toMatchObject({ amount: 170, kind: 'upTo', fraudCaught: false })
  })
  it('"I didn\'t order this" = up to Rs 170, plus fraud caught', () => {
    expect(replyValue('notMine')).toMatchObject({ amount: 170, kind: 'upTo', fraudCaught: true })
  })
  it('per-case Rs 170 ceilings are never added into the Move 1 aggregate', () => {
    for (const r of ['confirm', 'reschedule', 'upi', 'cancel', 'notMine'] as const) {
      expect(replyValue(r).addToMove1Aggregate).toBe(false)
    }
  })
})

describe('Move 2: hub resale', () => {
  it('per parcel: Rs 120 - Rs 26 handling (21 + 5) - Rs 20 discount = Rs 74', () => {
    const p = move2PerParcel()
    expect(p.handling).toBe(26)
    expect(p.net).toBe(74)
  })
  it('standalone at 25% on 17,000 = 4,250 x Rs 74 = Rs 3.1L', () => {
    const m = move2('standalone', 'conservative')
    expect(m.parcels).toBeCloseTo(4_250, 6)
    expect(L(m.net)).toBe('₹3.1L')
  })
  it('standalone sensitivity: Rs 1.9L at 15%, Rs 4.4L at 35%', () => {
    expect(sensitivity('standalone', 'conservative').map((s) => L(s.net))).toEqual(['₹1.9L', '₹3.1L', '₹4.4L'])
  })
  it('sequenced conservative: 13,600 x 25% x Rs 74 = Rs 2.5L', () => {
    const m = move2('sequenced', 'conservative')
    expect(m.pool).toBeCloseTo(13_600, 6)
    expect(L(m.net)).toBe('₹2.5L')
  })
  it('sequenced ceiling: 7,650 x 25% x Rs 74 = Rs 1.4L', () => {
    const m = move2('sequenced', 'ceiling')
    expect(m.pool).toBeCloseTo(7_650, 6)
    expect(L(m.net)).toBe('₹1.4L')
  })
})

describe('Combined (sequenced)', () => {
  const lo = combined('conservative')
  const hi = combined('ceiling')
  it('net is Rs 5.4L to Rs 11.4L', () => {
    expect(L(lo.net)).toBe('₹5.4L')
    expect(L(hi.net)).toBe('₹11.4L')
  })
  it('is 26% to 56% of the Rs 20.4L true drag', () => {
    expect(Math.round(lo.shareOfDrag * 100)).toBe(26)
    expect(Math.round(hi.shareOfDrag * 100)).toBe(56)
  })
  it('illustrative RTO 17% -> 13.6% (conservative) / 7.65% (ceiling)', () => {
    expect(pctTrim(lo.rtoRateBefore)).toBe('17%')
    expect(pctTrim(lo.rtoRateAfter)).toBe('13.6%')
    expect(pctTrim(hi.rtoRateAfter)).toBe('7.65%')
  })
  it('Move 2 does not change the RTO rate', () => {
    const noResale = combined('conservative', 'sequenced', { ...defaultInputs(), m2Match: 0 })
    expect(noResale.rtoRateAfter).toBe(lo.rtoRateAfter)
  })
  it('waterfall ends at true drag minus combined net', () => {
    const w = waterfall('conservative', 'sequenced')
    expect(w[w.length - 1].value).toBeCloseTo(2_040_000 - lo.net, 6)
  })
})

describe('Network illustration (upper bound, not a forecast)', () => {
  it('764M orders scales the combined range to about Rs 410-870 Cr/year', () => {
    const n = networkIllustration()
    expect(n.lowCr).toBe(410)
    expect(n.highCr).toBe(870)
  })
})

describe('Rider attempt validation (no GPS)', () => {
  it('no logged call -> auto-reject', () => {
    expect(validateUnavailable([]).verdict).toBe('rejected')
  })
  it('logged but unanswered -> verified, fee protected, follow-up sent', () => {
    const v = validateUnavailable([{ answered: false }])
    expect(v.verdict).toBe('verified')
    expect(v.feeProtected).toBe(A.riderAttemptFee.value)
    expect(v.followUp).toBe(true)
  })
  it('high-risk premium is Rs 5-10', () => {
    expect(riderPremium({ farHub: false, firstAddress: false })).toBe(0)
    expect(riderPremium({ farHub: true, firstAddress: false })).toBe(5)
    expect(riderPremium({ farHub: true, firstAddress: true })).toBe(10)
  })
})

describe('Resale eligibility', () => {
  const ok = { price: 699, perishable: false, personalised: false, sealIntact: true, photoLogged: true, sizeColourMatch: true }
  it('sneakers at Rs 699 pass every check (under the Rs 750 cap)', () => {
    expect(resaleChecks(ok).eligible).toBe(true)
  })
  it('an item at Rs 750 or more fails the cap', () => {
    expect(resaleChecks({ ...ok, price: 750 }).eligible).toBe(false)
  })
  it('5 business days skip weekends', () => {
    const fri = new Date(2026, 9, 2) // Fri 2 Oct 2026
    expect(addBusinessDays(fri, 5).getDate()).toBe(9)
  })
})

describe('Pilot sizing', () => {
  it('the deck design: 20 treated (highest-RTO) pincodes + 20 matched controls (control size assumed), 50 orders/pincode/week, 90 days, three 30-day phases', () => {
    const p = pilotSizing()
    expect(p.phases).toBe(3)
    expect(p.weeks).toBe(13)
    expect(p.treated).toBe(20)
    expect(p.control).toBe(20)
    expect(p.totalPincodes).toBe(40)
    expect(p.ordersPerPin).toBe(50 * 13)
    expect(p.ordersPerArm).toBe(13_000)
  })
  it('the control size is tagged as an assumption the deck does not state', () => {
    expect(A.pilotPincodesControl.source).toBe('assumption')
    expect(A.pilotPincodesControl.note).toMatch(/deck does not state/)
    expect(A.pilotIcc.source).toBe('assumption')
  })
})

describe('Pilot power (expected values computed independently with Python statistics.NormalDist)', () => {
  it('normInv matches standard quantiles', () => {
    expect(normInv(0.975)).toBeCloseTo(1.959964, 5)
    expect(normInv(0.8)).toBeCloseTo(0.841621, 5)
    expect(normInv(0.01)).toBeCloseTo(-2.326348, 5)
  })
  it('unclustered orders per arm: 17%->14% = 2,284; 17%->13.6% = 1,759; 17%->10% = 373', () => {
    expect(Math.ceil(twoPropN(0.17, 0.14))).toBe(2_284)
    expect(Math.ceil(twoPropN(0.17, 0.136))).toBe(1_759)
    expect(Math.ceil(twoPropN(0.17, 0.1))).toBe(373)
  })
  it('design effect is 1 + (m - 1) * ICC with m = orders per pincode over the pilot', () => {
    expect(designEffect(650, 0.02)).toBeCloseTo(13.98, 10)
    expect(designEffect(650, 0)).toBe(1)
  })
  it('planned design (20 pincodes/arm, 50/wk, 13 wks) MDE ≈ 1.3 / 3.4 / 4.6 / 6.9 points at ICC 0 / .01 / .02 / .05', () => {
    // Independent values (Python bisection): 1.2853, 3.4214, 4.5980, 6.8712 points
    const d = { pincodesPerArm: 20, ordersPerPinWeek: 50, weeks: 13 }
    const got = [0, 0.01, 0.02, 0.05].map((icc) => mde(0.17, { ...d, icc }) * 100)
    ;[1.2853, 3.4214, 4.598, 6.8712].forEach((v, k) => expect(got[k]).toBeCloseTo(v, 3))
    expect(got.map((x) => +x.toFixed(1))).toEqual([1.3, 3.4, 4.6, 6.9])
  })
  it('the 10-per-arm alternative MDE ≈ 1.8 / 4.75 / 6.3 / 9.3 points at ICC 0 / .01 / .02 / .05', () => {
    const d = { pincodesPerArm: 10, ordersPerPinWeek: 50, weeks: 13 }
    const got = [0, 0.01, 0.02, 0.05].map((icc) => mde(0.17, { ...d, icc }) * 100)
    ;[1.8059, 4.7493, 6.3355, 9.3197].forEach((v, k) => expect(got[k]).toBeCloseTo(v, 3))
  })
  it('pincodes per arm needed for a 3-point shift (17% -> 14%, 50/wk, 13 wks) ≈ 27 / 50 / 118 at ICC .01 / .02 / .05', () => {
    // Independent: ceil(n * DEFF / m) = ceil(26.31) / ceil(49.11) / ceil(117.50)
    const d = { ordersPerPinWeek: 50, weeks: 13 }
    expect([0.01, 0.02, 0.05].map((icc) => pincodesNeeded(0.17, 0.14, { ...d, icc }))).toEqual([27, 50, 118])
    expect(pincodesNeeded(0.17, 0.14, { ...d, icc: 0 })).toBe(4)
  })
  it('with realistic clustering the planned pilot detects about 4.6 points, not 3', () => {
    const p = pilotPower()
    expect(p.p1).toBeCloseTo(0.17, 12)
    expect(p.target).toBeCloseTo(0.136, 12)
    expect(p.nUnclustered).toBe(1_759)
    expect(+(p.mde * 100).toFixed(1)).toBe(4.6)
    expect(p.mde).toBeGreaterThan(0.03)
    expect(p.detectable).toBe(false)
  })
  it('adding pincodes beats adding weeks (20/arm, ICC 0.02)', () => {
    // Independent: 4.598 -> 4.522 with double weeks, 3.310 with double pincodes
    const base = { pincodesPerArm: 20, ordersPerPinWeek: 50, weeks: 13, icc: 0.02 }
    const doubleWeeks = mde(0.17, { ...base, weeks: 26 })
    const doublePins = mde(0.17, { ...base, pincodesPerArm: 40 })
    expect(doubleWeeks * 100).toBeCloseTo(4.522, 2)
    expect(doublePins * 100).toBeCloseTo(3.31, 2)
    expect(doublePins).toBeLessThan(doubleWeeks)
  })
  it('with ICC 0.02 more weeks cannot reach a 3.4-point shift at 20 pincodes/arm; with no clustering it takes 2 weeks', () => {
    expect(weeksNeeded(0.17, 0.136, { pincodesPerArm: 20, ordersPerPinWeek: 50, icc: 0.02 })).toBe(Infinity)
    expect(weeksNeeded(0.17, 0.136, { pincodesPerArm: 20, ordersPerPinWeek: 50, icc: 0 })).toBe(2)
  })
})

describe('Business-day helpers', () => {
  it('subtracting then counting business days round-trips', async () => {
    const { businessDaysBetween } = await import('./model')
    const mon = new Date(2026, 9, 5)
    const back = addBusinessDays(mon, -5)
    expect(back.getDate()).toBe(28) // Mon 28 Sep
    expect(businessDaysBetween(back, mon)).toBe(5)
  })
})

describe('Placeholder rider attempt fee', () => {
  it('is labelled a placeholder assumption', () => {
    expect(A.riderAttemptFee.source).toBe('assumption')
    expect(A.riderAttemptFee.label).toMatch(/placeholder/)
  })
  it('never feeds the headline or the combined range', () => {
    const base = defaultInputs()
    const bumped = { ...base, riderAttemptFee: 999 }
    for (const c of ['conservative', 'ceiling'] as const) {
      expect(combined(c, 'sequenced', bumped)).toEqual(combined(c, 'sequenced', base))
    }
    expect(networkIllustration(bumped)).toEqual(networkIllustration(base))
    expect(baseline(bumped)).toEqual(baseline(base))
  })
})

describe('Failure-case scenarios (A4): every ₹ effect from existing assumptions', () => {
  const e = scenarioEffects()
  it('no reply and IVR failure ship as today and cost only the messaging spend (₹1.20 per order)', () => {
    expect(e.noReply.amount).toBeCloseTo(-messagingCostPerOrder(), 10)
    expect(e.noReply.amount).toBeCloseTo(-1.2, 10)
    expect(e.ivrFail).toEqual(e.noReply)
  })
  it('a reply after cancellation changes nothing: the cancellation already avoided up to ₹170', () => {
    expect(e.lateReply).toEqual({ amount: 170, kind: 'upTo' })
  })
  it('rider offline: no saving; the placeholder attempt fee is protected pending review', () => {
    expect(e.riderOffline.amount).toBe(0)
    expect(e.riderOffline.riderFeeProtected).toBe(A.riderAttemptFee.value)
  })
  it('same-device buyer blocked, next buyer matched: the normal ₹74 resale saving', () => {
    expect(e.sameDeviceBlocked.amount).toBe(74)
  })
  it('resale buyer cancels: standard RTO with ₹5 re-bagging already spent', () => {
    expect(e.buyerCancels.amount).toBe(-5)
  })
  it('5-day timeout: standard RTO, same cost as today', () => {
    expect(e.timeout.amount).toBe(0)
  })
  it('the placeholder rider fee does not change any scenario saving', () => {
    const bumped = scenarioEffects({ ...defaultInputs(), riderAttemptFee: 999 })
    for (const k of Object.keys(e) as (keyof typeof e)[]) expect(bumped[k].amount).toBe(e[k].amount)
  })
})
