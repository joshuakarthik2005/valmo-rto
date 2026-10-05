/**
 * Single source of truth for every number in the prototype.
 * Components never hard-code figures: they read from here or from src/lib/model.ts.
 *
 * Source tags:
 *  - 'case'       Case data pack (Meesho DICE S3 problem statement)
 *  - 'primary'    Primary research (n=25, small: 5 riders/hub operators + 20 shoppers).
 *                 Only aggregate percentages are stored; no names, quotes or raw responses.
 *  - 'assumption' Team planning assumption, to be tested in the pilot
 */
export type SourceTag = 'case' | 'primary' | 'assumption'

export const SOURCE_LABEL: Record<SourceTag, string> = {
  case: 'Case data pack',
  primary: 'Primary research (n=25, small)',
  assumption: 'Assumption',
}

export interface Assumption {
  id: string
  label: string
  value: number
  unit: 'orders' | 'share' | 'rupees' | 'days' | 'count' | 'x'
  source: SourceTag
  note?: string
  /** Simulator slider bounds, if this assumption is user-adjustable */
  range?: { min: number; max: number; step: number }
}

const a = (x: Assumption) => x

export const A = {
  // ---- Volume and mix ----
  ordersBase: a({ id: 'ordersBase', label: 'Orders in the illustration', value: 100_000, unit: 'orders', source: 'assumption', note: 'Every figure is expressed per 1 lakh orders.' }),
  codShare: a({ id: 'codShare', label: 'COD share of orders', value: 0.8, unit: 'share', source: 'case', range: { min: 0.5, max: 0.95, step: 0.05 } }),
  codRto: a({ id: 'codRto', label: 'RTO rate, COD', value: 0.2, unit: 'share', source: 'case' }),
  prepaidRto: a({ id: 'prepaidRto', label: 'RTO rate, prepaid', value: 0.05, unit: 'share', source: 'case' }),

  // ---- Unit costs ----
  forwardCost: a({ id: 'forwardCost', label: 'Forward leg per order', value: 50, unit: 'rupees', source: 'case', note: 'Spent whether or not the parcel is delivered.' }),
  reverseCost: a({ id: 'reverseCost', label: 'Reverse (return) leg per RTO', value: 120, unit: 'rupees', source: 'case', note: 'The true incremental cost of a failure that still ships.' }),
  lmdcLeg: a({ id: 'lmdcLeg', label: 'LMDC last-mile leg (resale re-delivery)', value: 21, unit: 'rupees', source: 'case' }),

  // ---- Distance gradient ----
  rtoNear: a({ id: 'rtoNear', label: 'RTO rate, near hub', value: 0.15, unit: 'share', source: 'case' }),
  rtoModerate: a({ id: 'rtoModerate', label: 'RTO rate, moderate distance', value: 0.17, unit: 'share', source: 'case' }),
  rtoFar: a({ id: 'rtoFar', label: 'RTO rate, far from hub', value: 0.22, unit: 'share', source: 'case' }),

  // ---- Move 1: reconfirmation ladder ----
  m1Definitely: a({ id: 'm1Definitely', label: 'Shoppers who would "definitely" reply to a reconfirmation', value: 0.4, unit: 'share', source: 'primary', range: { min: 0.1, max: 0.7, step: 0.05 } }),
  m1Maybe: a({ id: 'm1Maybe', label: 'Shoppers who "maybe" would reply', value: 0.3, unit: 'share', source: 'primary', range: { min: 0, max: 0.5, step: 0.05 } }),
  m1Haircut: a({ id: 'm1Haircut', label: 'Intent-to-action haircut (conservative case)', value: 0.5, unit: 'share', source: 'assumption', note: 'Half of stated intent turns into action.', range: { min: 0.2, max: 1, step: 0.05 } }),
  m1MessagingCost: a({ id: 'm1MessagingCost', label: 'WhatsApp/SMS + IVR cost per 1 lakh orders', value: 120_000, unit: 'rupees', source: 'assumption', note: 'Same cost in conservative and ceiling cases.', range: { min: 40_000, max: 300_000, step: 10_000 } }),

  // ---- UPI switch ----
  upiDiscount: a({ id: 'upiDiscount', label: 'Discount for switching COD to UPI', value: 20, unit: 'rupees', source: 'assumption', range: { min: 0, max: 30, step: 5 } }),
  upiDiscountAlt: a({ id: 'upiDiscountAlt', label: 'Alternative smaller UPI discount', value: 10, unit: 'rupees', source: 'assumption' }),

  // ---- Move 2: hub resale ----
  m2Rebag: a({ id: 'm2Rebag', label: 'Re-bagging at hub', value: 5, unit: 'rupees', source: 'assumption' }),
  m2BuyerDiscount: a({ id: 'm2BuyerDiscount', label: 'Discount to the resale buyer', value: 20, unit: 'rupees', source: 'assumption', range: { min: 0, max: 60, step: 5 } }),
  m2Match: a({ id: 'm2Match', label: 'Resale match rate', value: 0.25, unit: 'share', source: 'assumption', range: { min: 0.05, max: 0.5, step: 0.01 } }),
  m2MatchLow: a({ id: 'm2MatchLow', label: 'Resale match rate, low sensitivity', value: 0.15, unit: 'share', source: 'assumption' }),
  m2MatchHigh: a({ id: 'm2MatchHigh', label: 'Resale match rate, high sensitivity', value: 0.35, unit: 'share', source: 'assumption' }),
  m2PriceCap: a({ id: 'm2PriceCap', label: 'Resale value cap', value: 750, unit: 'rupees', source: 'assumption', note: 'About 2x average order value; high-value items excluded.' }),
  m2WindowDays: a({ id: 'm2WindowDays', label: 'Resale shelf window', value: 5, unit: 'days', source: 'assumption', note: 'Business days, then standard RTO. Inside the 45-day return policy.' }),
  returnPolicyDays: a({ id: 'returnPolicyDays', label: 'Meesho return policy window', value: 45, unit: 'days', source: 'case' }),

  // ---- Rider incentives ----
  riderAttemptFee: a({ id: 'riderAttemptFee', label: 'Standard attempt fee (protected when verified)', value: 15, unit: 'rupees', source: 'assumption', note: 'Placeholder; replace with the actual Valmo rate card.' }),
  riderPremiumMin: a({ id: 'riderPremiumMin', label: 'High-risk delivery premium, low', value: 5, unit: 'rupees', source: 'assumption' }),
  riderPremiumMax: a({ id: 'riderPremiumMax', label: 'High-risk delivery premium, high', value: 10, unit: 'rupees', source: 'assumption' }),

  // ---- Network illustration ----
  networkOrdersFY25: a({ id: 'networkOrdersFY25', label: 'Valmo orders, FY25', value: 764_000_000, unit: 'orders', source: 'assumption', note: 'Desk research based on the Meesho IPO prospectus. Used only for an upper-bound illustration, not a forecast.' }),

  // ---- Pilot ----
  pilotPincodes: a({ id: 'pilotPincodes', label: 'Pilot pincodes (treatment)', value: 20, unit: 'count', source: 'assumption' }),
  pilotControlPincodes: a({ id: 'pilotControlPincodes', label: 'Matched control pincodes', value: 20, unit: 'count', source: 'assumption' }),
  pilotMinOrdersPerPinWeek: a({ id: 'pilotMinOrdersPerPinWeek', label: 'Minimum orders per pincode per week, across the 90-day pilot', value: 50, unit: 'orders', source: 'assumption' }),
  pilotDays: a({ id: 'pilotDays', label: 'Pilot length', value: 90, unit: 'days', source: 'assumption' }),
  pilotPhaseDays: a({ id: 'pilotPhaseDays', label: 'Phase length', value: 30, unit: 'days', source: 'assumption' }),
} as const

export type AssumptionId = keyof typeof A

/**
 * Root-cause split from the n=20 shopper survey, extrapolated to 17,000 RTOs.
 * Illustrative only: small sample. Shares sum to exactly 1.
 */
export const ROOT_CAUSES = [
  { id: 'fake', label: 'Fake attempt', share: 0.2, fixedBy: 'Rider masked-call validation' },
  { id: 'changed', label: 'Changed mind', share: 0.2, fixedBy: 'Reconfirmation + hub resale' },
  { id: 'mismatch', label: 'Product mismatch', share: 0.15, fixedBy: 'Hub resale to a nearby buyer' },
  { id: 'nothome', label: 'Not home', share: 0.15, fixedBy: 'Delivery-window reschedule' },
  { id: 'nocash', label: 'No cash', share: 0.15, fixedBy: 'COD to UPI switch' },
  { id: 'scam', label: 'Never ordered / scam', share: 0.15, fixedBy: '"I didn\'t order this" hold' },
] as const

export const ROOT_CAUSE_SOURCE: SourceTag = 'primary'
export const ROOT_CAUSE_SAMPLE = 20

/** Open items we have not solved; shown on screen, never hidden. */
export const OPEN_ITEMS = [
  'GST treatment of the original order if it is never returned: flagged for Meesho finance.',
  'How a hub raises a compliant fresh invoice for a resale order without new backend work in the first 30 days.',
  'Seller consent model for resale (opt-in per catalogue vs per order).',
  'Native-speaker review of Hinglish and Hindi message copy.',
  'Actual rider rate card, to replace the placeholder attempt fee.',
]
