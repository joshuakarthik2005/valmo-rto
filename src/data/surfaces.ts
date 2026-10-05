import { A } from './assumptions'

export const SURFACES = [
  { id: 'customer', path: '/customer', label: 'Customer', who: 'Shopper', blurb: 'Reconfirm, reschedule, switch to UPI, or flag a parcel they never ordered.' },
  { id: 'rider', path: '/rider', label: 'Rider', who: 'Valmo rider', blurb: 'Masked calls and a call log make every "not available" mark checkable.' },
  { id: 'hub', path: '/hub', label: 'Hub', who: 'Hub supervisor', blurb: 'One control tower for risk, nudges, flagged attempts and the resale shelf.' },
  { id: 'resale', path: '/resale', label: 'Resale', who: 'Hub, buyer, seller', blurb: 'A refused parcel becomes a next-day local sale instead of a long trip back.' },
  { id: 'impact', path: '/impact', label: 'Impact', who: 'Leadership', blurb: 'Every rupee traced to an assumption you can move.' },
  { id: 'pilot', path: '/pilot', label: 'Pilot', who: 'Ops + analytics', blurb: `${A.pilotPincodes.value} pincodes against a matched control, over ${A.pilotDays.value} days.` },
] as const

export type SurfaceId = (typeof SURFACES)[number]['id']
