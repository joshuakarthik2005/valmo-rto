/**
 * All arithmetic for the prototype. Pure functions only: no React, no DOM.
 * Every number on screen is produced here from src/data/assumptions.ts.
 */
import { A, ROOT_CAUSES, type AssumptionId } from '../data/assumptions'

export type Inputs = Record<AssumptionId, number>

export function defaultInputs(): Inputs {
  const out = {} as Inputs
  for (const k of Object.keys(A) as AssumptionId[]) out[k] = A[k].value
  return out
}

export function withInputs(overrides: Partial<Inputs> = {}): Inputs {
  return { ...defaultInputs(), ...overrides }
}

// ---------- Baseline ----------

export function baseline(i: Inputs = defaultInputs()) {
  const codOrders = i.ordersBase * i.codShare
  const prepaidOrders = i.ordersBase - codOrders
  const codRtos = codOrders * i.codRto
  const prepaidRtos = prepaidOrders * i.prepaidRto
  const rtos = codRtos + prepaidRtos
  const rtoRate = rtos / i.ordersBase
  const grossPerRto = i.forwardCost + i.reverseCost
  const grossCost = rtos * grossPerRto
  /** True incremental drag: reverse leg only, the forward leg is spent either way. */
  const trueDrag = rtos * i.reverseCost
  /** Floor every order would carry at the prepaid rate. */
  const baselineOrders = i.ordersBase * i.prepaidRto
  const baselineCost = baselineOrders * i.reverseCost
  /** Extra RTOs caused by COD over the prepaid floor. */
  const codExcessOrders = codOrders * (i.codRto - i.prepaidRto)
  const codExcessCost = codExcessOrders * i.reverseCost
  const codGap = i.codRto / i.prepaidRto
  return {
    codOrders, prepaidOrders, codRtos, prepaidRtos, rtos, rtoRate,
    grossPerRto, grossCost, trueDrag,
    baselineOrders, baselineCost, codExcessOrders, codExcessCost, codGap,
  }
}

export function distanceGradient(i: Inputs = defaultInputs()) {
  return [
    { band: 'Near', rate: i.rtoNear },
    { band: 'Moderate', rate: i.rtoModerate },
    { band: 'Far', rate: i.rtoFar },
  ]
}

export function rootCauses(i: Inputs = defaultInputs()) {
  const b = baseline(i)
  return ROOT_CAUSES.map((c) => ({
    ...c,
    orders: b.rtos * c.share,
    cost: b.trueDrag * c.share,
  }))
}

// ---------- Move 1: reconfirmation ladder ----------

export type Case = 'conservative' | 'ceiling'

/** Share of RTOs prevented by Move 1. */
export function move1Rate(c: Case, i: Inputs = defaultInputs()) {
  return c === 'conservative'
    ? i.m1Definitely * i.m1Haircut
    : i.m1Definitely + i.m1Maybe / 2
}

/** Move 1 is always valued on the Rs 120 reverse leg, never Rs 170. */
export function move1(c: Case, i: Inputs = defaultInputs()) {
  const b = baseline(i)
  const rate = move1Rate(c, i)
  const orders = b.rtos * rate
  const gross = orders * i.reverseCost
  const cost = i.m1MessagingCost
  const net = gross - cost
  const remainingRtos = b.rtos - orders
  return { rate, orders, gross, cost, net, remainingRtos }
}

// ---------- UPI switch ----------

export function upiSwitch(discount: number, i: Inputs = defaultInputs()) {
  const points = i.codRto - i.prepaidRto
  const expectedSaving = points * i.reverseCost
  return { points, expectedSaving, discount, net: expectedSaving - discount }
}

// ---------- Per-response value in the customer flow ----------

export type Reply = 'confirm' | 'reschedule' | 'upi' | 'cancel' | 'notMine'

export interface ReplyValue {
  /** Amount shown to the user */
  amount: number
  /** 'counted' = exact, 'expected' = probability-weighted, 'upTo' = per-case ceiling */
  kind: 'counted' | 'expected' | 'upTo'
  /** Per-case ceilings must never be added to the Move 1 aggregate */
  addToMove1Aggregate: boolean
  fraudCaught: boolean
}

export function replyValue(r: Reply, i: Inputs = defaultInputs()): ReplyValue {
  switch (r) {
    case 'confirm':
    case 'reschedule':
      return { amount: 0, kind: 'counted', addToMove1Aggregate: false, fraudCaught: false }
    case 'upi':
      return { amount: upiSwitch(i.upiDiscount, i).expectedSaving, kind: 'expected', addToMove1Aggregate: false, fraudCaught: false }
    case 'cancel':
      // Never ships: both legs avoided.
      return { amount: i.forwardCost + i.reverseCost, kind: 'upTo', addToMove1Aggregate: false, fraudCaught: false }
    case 'notMine':
      return { amount: i.forwardCost + i.reverseCost, kind: 'upTo', addToMove1Aggregate: false, fraudCaught: true }
  }
}

// ---------- Move 2: hub resale ----------

export function move2PerParcel(i: Inputs = defaultInputs()) {
  const handling = i.lmdcLeg + i.m2Rebag
  const net = i.reverseCost - handling - i.m2BuyerDiscount
  return { avoided: i.reverseCost, handling, discount: i.m2BuyerDiscount, net }
}

export type Move2Mode = 'standalone' | 'sequenced'

export function move2(mode: Move2Mode, c: Case, i: Inputs = defaultInputs(), match = i.m2Match) {
  const pool = mode === 'standalone' ? baseline(i).rtos : move1(c, i).remainingRtos
  const parcels = pool * match
  const per = move2PerParcel(i).net
  return { pool, match, parcels, perParcel: per, net: parcels * per }
}

export function sensitivity(mode: Move2Mode, c: Case, i: Inputs = defaultInputs()) {
  return [i.m2MatchLow, i.m2Match, i.m2MatchHigh].map((m) => move2(mode, c, i, m))
}

// ---------- Combined ----------

export function combined(c: Case, mode: Move2Mode = 'sequenced', i: Inputs = defaultInputs()) {
  const b = baseline(i)
  const m1 = move1(c, i)
  const m2 = move2(mode, c, i)
  const net = m1.net + m2.net
  const shareOfDrag = net / b.trueDrag
  /** Move 2 does not change the RTO rate; it cuts the cost of failures that still occur. */
  const rtoRateAfter = m1.remainingRtos / i.ordersBase
  return { m1, m2, net, shareOfDrag, rtoRateBefore: b.rtoRate, rtoRateAfter }
}

/** Waterfall steps from true drag down to remaining drag. */
export function waterfall(c: Case, mode: Move2Mode, i: Inputs = defaultInputs()) {
  const b = baseline(i)
  const m1 = move1(c, i)
  const m2 = move2(mode, c, i)
  const remaining = b.trueDrag - m1.gross + m1.cost - m2.net
  return [
    { key: 'drag', label: 'True RTO drag', value: b.trueDrag, kind: 'total' as const },
    { key: 'm1', label: 'Move 1: reconfirm', value: -m1.gross, kind: 'delta' as const },
    { key: 'm1cost', label: 'Messaging + IVR', value: m1.cost, kind: 'delta' as const },
    { key: 'm2', label: 'Move 2: hub resale', value: -m2.net, kind: 'delta' as const },
    { key: 'left', label: 'Remaining drag', value: remaining, kind: 'total' as const },
  ]
}

// ---------- Network illustration (upper bound, not a forecast) ----------

export function networkIllustration(i: Inputs = defaultInputs()) {
  const scale = i.networkOrdersFY25 / i.ordersBase
  const low = combined('conservative', 'sequenced', i).net * scale
  const high = combined('ceiling', 'sequenced', i).net * scale
  return { scale, low, high, lowCr: roundTo(low / 1e7, 10), highCr: roundTo(high / 1e7, 10) }
}

// ---------- Rider ----------

export type CallOutcome = 'none' | 'unanswered' | 'answered'

export function validateUnavailable(calls: { answered: boolean }[], i: Inputs = defaultInputs()) {
  if (calls.length === 0) {
    return { verdict: 'rejected' as const, feeProtected: 0, followUp: false, reason: 'No masked call logged before marking unavailable.' }
  }
  if (calls.some((c) => c.answered)) {
    return { verdict: 'review' as const, feeProtected: 0, followUp: false, reason: 'Customer answered; reattempt or record the refusal instead.' }
  }
  return { verdict: 'verified' as const, feeProtected: i.riderAttemptFee, followUp: true, reason: 'Logged call went unanswered: verified attempt.' }
}

export function riderPremium(flags: { farHub: boolean; firstAddress: boolean }, i: Inputs = defaultInputs()) {
  if (flags.farHub && flags.firstAddress) return i.riderPremiumMax
  if (flags.farHub || flags.firstAddress) return i.riderPremiumMin
  return 0
}

// ---------- Resale eligibility ----------

export interface ResaleItem {
  price: number
  perishable: boolean
  personalised: boolean
  sealIntact: boolean
  photoLogged: boolean
  sizeColourMatch: boolean
}

export function resaleChecks(item: ResaleItem, i: Inputs = defaultInputs()) {
  const checks = [
    { id: 'perishable', label: 'Non-perishable', pass: !item.perishable },
    { id: 'personalised', label: 'Not personalised', pass: !item.personalised },
    { id: 'cap', label: `Value under the cap`, pass: item.price < i.m2PriceCap },
    { id: 'seal', label: 'Tamper seal intact', pass: item.sealIntact },
    { id: 'photo', label: 'Photo logged at check-in', pass: item.photoLogged },
    { id: 'match', label: 'Size and colour match the listing', pass: item.sizeColourMatch },
  ]
  return { checks, eligible: checks.every((c) => c.pass) }
}

/** Add business days (Mon-Fri) to a date. */
export function addBusinessDays(start: Date, days: number) {
  const d = new Date(start)
  let left = days
  while (left > 0) {
    d.setDate(d.getDate() + 1)
    const wd = d.getDay()
    if (wd !== 0 && wd !== 6) left--
  }
  return d
}

// ---------- Pilot ----------

export function pilotSizing(i: Inputs = defaultInputs()) {
  const weeks = Math.round(i.pilotDays / 7)
  const phases = i.pilotDays / i.pilotPhaseDays
  const minOrdersPerPin = i.pilotMinOrdersPerPinWeek * weeks
  const minTreatmentOrders = minOrdersPerPin * i.pilotPincodes
  return { weeks, phases, minOrdersPerPin, minTreatmentOrders }
}

// ---------- Formatting ----------

export function roundTo(n: number, step: number) {
  return Math.round(n / step) * step
}

/** Rs value in lakh with one decimal, e.g. 2_040_000 -> "₹20.4L" */
export function lakh(n: number, digits = 1) {
  const sign = n < 0 ? '−' : ''
  return `${sign}₹${(Math.abs(n) / 1e5).toFixed(digits)}L`
}

export function rupees(n: number) {
  const sign = n < 0 ? '−' : ''
  return `${sign}₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`
}

export function count(n: number) {
  return Math.round(n).toLocaleString('en-IN')
}

export function pct(n: number, digits = 0) {
  return `${(n * 100).toFixed(digits)}%`
}

/** Percentage that drops trailing zeros: 0.136 -> "13.6%", 0.0765 -> "7.65%", 0.17 -> "17%" */
export function pctTrim(n: number) {
  return `${parseFloat((n * 100).toFixed(2))}%`
}
