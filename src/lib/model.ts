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

/** Add (or, with a negative count, subtract) business days (Mon-Fri). */
export function addBusinessDays(start: Date, days: number) {
  const d = new Date(start)
  const dir = days < 0 ? -1 : 1
  let left = Math.abs(days)
  while (left > 0) {
    d.setDate(d.getDate() + dir)
    const wd = d.getDay()
    if (wd !== 0 && wd !== 6) left--
  }
  return d
}

/** Business days from a to b (0 if b is not after a). */
export function businessDaysBetween(a: Date, b: Date) {
  let n = 0
  const d = new Date(a)
  while (d < b) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6 && d <= b) n++
  }
  return n
}

// ---------- Pilot ----------

export function pilotSizing(i: Inputs = defaultInputs()) {
  const weeks = Math.round(i.pilotDays / 7)
  const phases = i.pilotDays / i.pilotPhaseDays
  const ordersPerPin = i.pilotOrdersPerPinWeek * weeks
  const ordersPerArm = ordersPerPin * i.pilotPincodesTreated
  return { weeks, phases, ordersPerPin, ordersPerArm, treated: i.pilotPincodesTreated, control: i.pilotPincodesControl, totalPincodes: i.pilotPincodesTreated + i.pilotPincodesControl }
}

// ---------- Pilot power (two proportions, cluster-randomised by pincode) ----------

/** Inverse standard-normal CDF (Acklam's algorithm, relative error < 1.2e-9). */
export function normInv(p: number): number {
  if (!(p > 0 && p < 1)) throw new RangeError('p must be in (0, 1)')
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239]
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572]
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]
  const lo = 0.02425
  if (p < lo) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p > 1 - lo) return -normInv(1 - p)
  const q = p - 0.5
  const r = q * q
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

/**
 * Orders per arm needed to detect p1 vs p2 with an unclustered two-proportion z-test
 * (two-sided alpha, given power): n = [z_a/2 * sqrt(2 p q) + z_b * sqrt(p1 q1 + p2 q2)]^2 / (p1 - p2)^2.
 * Not rounded; callers round up.
 */
export function twoPropN(p1: number, p2: number, alpha = 0.05, power = 0.8) {
  const za = normInv(1 - alpha / 2)
  const zb = normInv(power)
  const pBar = (p1 + p2) / 2
  const num = za * Math.sqrt(2 * pBar * (1 - pBar)) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))
  return (num * num) / ((p1 - p2) * (p1 - p2))
}

/** Design effect for cluster randomisation: 1 + (m - 1) * ICC, m = orders per pincode over the pilot. */
export function designEffect(m: number, icc: number) {
  return 1 + (m - 1) * icc
}

export interface PowerDesign { pincodesPerArm: number; ordersPerPinWeek: number; weeks: number; icc: number }

/** Effective (independent-equivalent) orders per arm for a clustered design. */
export function effectiveN(d: PowerDesign) {
  const m = d.ordersPerPinWeek * d.weeks
  const deff = designEffect(m, d.icc)
  return { m, deff, raw: m * d.pincodesPerArm, eff: (m * d.pincodesPerArm) / deff }
}

/** Minimum detectable reduction (in proportion points) from baseline p1 for a design. Bisection on twoPropN. */
export function mde(p1: number, d: PowerDesign, alpha = 0.05, power = 0.8) {
  const { eff } = effectiveN(d)
  let lo = 1e-6, hi = p1 - 1e-6
  if (twoPropN(p1, p1 - hi, alpha, power) > eff) return NaN
  for (let k = 0; k < 100; k++) {
    const mid = (lo + hi) / 2
    if (twoPropN(p1, p1 - mid, alpha, power) > eff) lo = mid
    else hi = mid
  }
  return hi
}

/**
 * Weeks needed to detect p1 -> p2 with a given number of pincodes and weekly volume.
 * With ICC > 0, effective n per arm can never exceed pincodes / ICC, so more weeks may not help: returns Infinity.
 */
export function weeksNeeded(p1: number, p2: number, d: Omit<PowerDesign, 'weeks'>, alpha = 0.05, power = 0.8, maxWeeks = 520) {
  const need = twoPropN(p1, p2, alpha, power)
  for (let w = 1; w <= maxWeeks; w++) {
    if (effectiveN({ ...d, weeks: w }).eff >= need) return w
  }
  return Infinity
}

/**
 * Pincodes per arm needed to detect p1 -> p2 at a given weekly volume, length and ICC:
 * ceil(n * DEFF / m), with m = orders per pincode over the pilot.
 */
export function pincodesNeeded(p1: number, p2: number, d: Omit<PowerDesign, 'pincodesPerArm'>, alpha = 0.05, power = 0.8) {
  const m = d.ordersPerPinWeek * d.weeks
  return Math.ceil((twoPropN(p1, p2, alpha, power) * designEffect(m, d.icc)) / m)
}

/** Everything the pilot calculator shows, from one set of inputs. Assumes equal arms (control = treated). */
export function pilotPower(i: Inputs = defaultInputs(), target = combined('conservative', 'sequenced', i).rtoRateAfter) {
  const p1 = baseline(i).rtoRate
  const { weeks } = pilotSizing(i)
  const design: PowerDesign = { pincodesPerArm: i.pilotPincodesTreated, ordersPerPinWeek: i.pilotOrdersPerPinWeek, weeks, icc: i.pilotIcc }
  const nUnclustered = Math.ceil(twoPropN(p1, target, i.pilotAlpha, i.pilotPower))
  const eff = effectiveN(design)
  const nClustered = Math.ceil(nUnclustered * eff.deff)
  return {
    p1, target, shift: p1 - target, design, weeks, ...eff,
    nUnclustered, nClustered,
    mde: mde(p1, design, i.pilotAlpha, i.pilotPower),
    weeksNeeded: weeksNeeded(p1, target, design, i.pilotAlpha, i.pilotPower),
    detectable: eff.eff >= nUnclustered,
    /** Upper limit on effective n per arm as weeks grow without bound */
    effCeiling: i.pilotIcc > 0 ? i.pilotPincodesTreated / i.pilotIcc : Infinity,
  }
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

// ---------- Order risk (illustrative tiering for the demo manifest) ----------

export function orderRisk(o: { band: 'near' | 'moderate' | 'far'; cod: boolean; firstAddress: boolean }, i: Inputs = defaultInputs()) {
  const bandRate = { near: i.rtoNear, moderate: i.rtoModerate, far: i.rtoFar }[o.band]
  const blended = baseline(i).rtoRate
  const est = bandRate * ((o.cod ? i.codRto : i.prepaidRto) / blended)
  const tier: 'High' | 'Medium' | 'Low' = o.cod && (o.band === 'far' || o.firstAddress) ? 'High' : o.cod ? 'Medium' : 'Low'
  const reasons = [o.cod ? 'COD' : 'Prepaid', o.firstAddress ? 'first-time address' : null, o.band === 'far' ? 'far from hub' : null].filter(Boolean) as string[]
  return { est, tier, reasons }
}

/** Resale price for the buyer, after the Move 2 discount. */
export function resalePrice(price: number, i: Inputs = defaultInputs()) {
  return price - i.m2BuyerDiscount
}

// ---------- Pilot guardrails ----------

/** Messaging cost per order, used as the cost-per-order guardrail. */
export function messagingCostPerOrder(i: Inputs = defaultInputs()) {
  return i.m1MessagingCost / i.ordersBase
}
