/**
 * Fictional demo records. No real customers, riders or sellers.
 * Prices are illustrative catalogue values; every rupee figure derived from them comes from src/lib/model.ts.
 */
export type Band = 'near' | 'moderate' | 'far'
export type Nudge = 'not-needed' | 'sent' | 'confirmed' | 'rescheduled' | 'ivr' | 'hub-call' | 'cancelled' | 'held'

export interface Order {
  id: string
  name: string
  item: string
  price: number
  pin: string
  area: string
  band: Band
  cod: boolean
  firstAddress: boolean
  nudge: Nudge
  /** minutes until dispatch cut-off, for the hub SLA timer */
  slaMin: number
}

export const HUB = { name: 'Salem West', city: 'Salem, Tamil Nadu' }

export const ORDERS: Order[] = [
  { id: 'MSH-48213', name: 'Priya', item: 'Kurti set', price: 499, pin: '636007', area: 'Fairlands', band: 'moderate', cod: true, firstAddress: true, nudge: 'sent', slaMin: 95 },
  { id: 'MSH-48590', name: 'Arun', item: 'Sneakers', price: 699, pin: '636009', area: 'Suramangalam', band: 'far', cod: true, firstAddress: false, nudge: 'ivr', slaMin: 40 },
  { id: 'MSH-48611', name: 'Meena', item: 'Steel tiffin box', price: 349, pin: '636004', area: 'Hasthampatti', band: 'near', cod: false, firstAddress: false, nudge: 'not-needed', slaMin: 180 },
  { id: 'MSH-48702', name: 'Karthik', item: 'Phone cover', price: 199, pin: '636016', area: 'Kondalampatti', band: 'far', cod: true, firstAddress: true, nudge: 'hub-call', slaMin: 18 },
  { id: 'MSH-48755', name: 'Divya', item: 'Cotton saree', price: 649, pin: '636008', area: 'Alagapuram', band: 'moderate', cod: true, firstAddress: false, nudge: 'confirmed', slaMin: 140 },
  { id: 'MSH-48790', name: 'Ravi', item: 'Bedsheet', price: 429, pin: '636007', area: 'Fairlands', band: 'near', cod: true, firstAddress: false, nudge: 'rescheduled', slaMin: 220 },
  { id: 'MSH-48812', name: 'Lakshmi', item: 'Hair dryer', price: 599, pin: '636012', area: 'Ammapet', band: 'moderate', cod: false, firstAddress: true, nudge: 'not-needed', slaMin: 160 },
  { id: 'MSH-48840', name: 'Suresh', item: 'Kids T-shirt pack', price: 379, pin: '636016', area: 'Kondalampatti', band: 'far', cod: true, firstAddress: false, nudge: 'cancelled', slaMin: 0 },
]

export const SLOTS = ['Thu, 2–6 PM', 'Fri, 10 AM–2 PM', 'Fri, 2–6 PM', 'Sat, 10 AM–2 PM']

/** Rider attempt marks waiting for hub review. */
export const FLAGGED = [
  { id: 'ATT-2201', order: 'MSH-48402', rider: 'Rider R-14', reason: 'Marked unavailable with no logged call', verdict: 'rejected' as const },
  { id: 'ATT-2207', order: 'MSH-48455', rider: 'Rider R-09', reason: 'Customer answered, rider still marked unavailable', verdict: 'review' as const },
  { id: 'ATT-2210', order: 'MSH-48470', rider: 'Rider R-14', reason: 'Logged call unanswered, follow-up sent', verdict: 'verified' as const },
]

/** Parcels on the hub resale shelf; checkedIn = business days ago. */
export const SHELF = [
  { id: 'MSH-48590', item: 'Sneakers, size 8, white', price: 699, checkedInDaysAgo: 0, status: 'matching' as const },
  { id: 'MSH-48377', item: 'Cotton kurti, M, blue', price: 449, checkedInDaysAgo: 2, status: 'matched' as const },
  { id: 'MSH-48291', item: 'Wall clock', price: 389, checkedInDaysAgo: 4, status: 'matching' as const },
  { id: 'MSH-48150', item: 'Backpack, grey', price: 549, checkedInDaysAgo: 5, status: 'reverting' as const },
]

/** Nearby buyers who viewed or wishlisted the resale item. Device flag blocks the original buyer. */
export const BUYERS = [
  { id: 'A', label: 'Buyer A', km: 0.8, signal: 'Viewed 3 times', sameDevice: false },
  { id: 'B', label: 'Buyer B', km: 1.9, signal: 'Wishlisted', sameDevice: false },
  { id: 'C', label: 'Buyer C', km: 1.1, signal: 'Viewed 2 times', sameDevice: true },
]

export const RESALE_ITEM = {
  id: 'MSH-48590',
  newId: 'MSH-51002',
  name: 'Sneakers, size 8, white',
  price: 699,
  seller: 'Seller: Kaveri Footwear (fictional)',
  perishable: false,
  personalised: false,
  sealIntact: true,
  photoLogged: true,
  sizeColourMatch: true,
}

/** Fixed demo "today" so countdowns and screenshots are deterministic. */
export const DEMO_TODAY = new Date(2026, 9, 5, 14, 5)
