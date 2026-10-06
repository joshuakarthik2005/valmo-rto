/**
 * Proposed architecture for running Route Cause on Valmo's network.
 * Everything here is a proposal. Anything that depends on Valmo's internal systems is marked `confirm: true`
 * and shown on screen as "to confirm with Valmo". No vendor is named and no integration exists.
 */

export const PIPELINE = [
  { id: 'events', title: 'Order and delivery events', body: 'Order, address, payment-mode and attempt events from the order and last-mile systems.', confirm: true },
  { id: 'risk', title: 'Risk scoring', body: 'Payment mode and distance tier decide who gets the reconfirmation ladder. The score is explainable and has no black box.', confirm: false },
  { id: 'messaging', title: 'Messaging ladder', body: 'WhatsApp/SMS at T-48h, the delivery window at T-24h, IVR at T-2h, then a hub call. Replies come back as events.', confirm: false },
  { id: 'rider', title: 'Rider app', body: 'Masked calls and a call log back every "customer unavailable" mark. The OTP confirms delivery only.', confirm: true },
  { id: 'hub', title: 'Hub control tower', body: 'Risk, nudge status, dispatch timers, flagged attempt marks and the resale shelf, on one screen.', confirm: false },
  { id: 'resale', title: 'Hub resale', body: 'Eligibility check, nearby-buyer match, a new order and invoice, next-day delivery, or revert to standard RTO.', confirm: true },
] as const

export interface EventDef { name: string; when: string; fields: string; confirm: boolean }

/** Proposed event schema. Field names are illustrative; the source system for each is to be confirmed. */
export const EVENTS: EventDef[] = [
  { name: 'order.created', when: 'Order placed', fields: 'order_id, created_at, payment_mode, order_value, pincode, address_first_use', confirm: true },
  { name: 'order.dispatch_planned', when: 'Delivery slot assigned', fields: 'order_id, hub_id, slot_start, slot_end, distance_tier', confirm: true },
  { name: 'nudge.sent', when: 'Each ladder step', fields: 'order_id, step (t48 | t24 | ivr | hub_call), channel, sent_at', confirm: false },
  { name: 'reply.received', when: 'Customer answers', fields: 'order_id, reply (confirm | reschedule | cancel | not_mine | upi), new_slot?, received_at', confirm: false },
  { name: 'attempt.call_logged', when: 'Rider calls via the masked number', fields: 'order_id, rider_id, placed_at, answered (bool), duration_s', confirm: true },
  { name: 'attempt.marked', when: 'Rider marks an outcome', fields: 'order_id, rider_id, outcome (delivered | unavailable | refused), marked_at, otp_ok?', confirm: true },
  { name: 'attempt.checked', when: 'Validation runs on a mark', fields: 'order_id, verdict (verified | rejected | review), reason', confirm: false },
  { name: 'rto.received_at_hub', when: 'Refused parcel back at hub', fields: 'order_id, hub_id, received_at, seal_intact, photo_ref', confirm: true },
  { name: 'resale.decided', when: 'Eligibility, match or timeout', fields: 'order_id, decision (listed | matched | reverted), new_order_id?, decided_at', confirm: false },
]

/** Data the pilot would need from Valmo. */
export const DATA_NEEDED = [
  { item: 'Order', detail: 'Order ID, value, item category, seller ID, created time', why: 'Ladder timing, resale cap and eligibility' },
  { item: 'Address', detail: 'Pincode, a first-time-address flag, hub mapping', why: 'Distance tier, the first-time-address flag, pilot randomisation' },
  { item: 'Payment mode', detail: 'COD or prepaid, and changes before dispatch', why: 'Risk score and the COD → UPI switch' },
  { item: 'Attempt events', detail: 'Rider outcome marks with timestamps, OTP confirmation', why: 'Attempt validation and the RTO outcome' },
  { item: 'Customer contact consent', detail: 'Messaging opt-in status per customer', why: 'Who may receive WhatsApp nudges' },
]

export const INTEGRATIONS = [
  { name: 'WhatsApp Business API', use: 'T-48h nudge and T-24h window with one-tap replies', needs: 'Approved message templates, customer opt-in, a reply webhook' },
  { name: 'SMS', use: 'Fallback for customers without WhatsApp or opt-in', needs: 'Registered sender and templates' },
  { name: 'IVR', use: 'T-2h automated call: press 1 / 2 / 3', needs: 'Keypress capture posted back as reply.received' },
  { name: 'Masked calling', use: 'Rider ↔ customer calls without revealing numbers', needs: 'Per-order proxy number and a call-detail webhook with answered/duration' },
]

export const BUILD_VS_INTEGRATE: { part: string; choice: string; why: string; confirm?: boolean }[] = [
  { part: 'Risk score', choice: 'Build', why: 'Two inputs and a published table. It has to stay explainable.' },
  { part: 'Ladder orchestration (timers, escalation)', choice: 'Build', why: 'Small state machine on order events; the core of Move 1.' },
  { part: 'WhatsApp / SMS / IVR delivery', choice: 'Integrate', why: 'Commodity channels; reuse whatever Meesho already contracts.' },
  { part: 'Masked calling and call logs', choice: 'Integrate', why: 'Telephony is a provider problem; the call log is what we validate against.' },
  { part: 'Attempt validation', choice: 'Build', why: 'Simple rules over the call log and the mark.' },
  { part: 'Hub control tower', choice: 'Build (on existing hub tools)', why: 'Views over the events above; extend the hub UI Valmo already has.', confirm: true },
  { part: 'Resale listing and invoicing', choice: 'Integrate', why: "Reuse Meesho's order and invoice flow. The hub only prints and affixes.", confirm: true },
]

export const FAILURE_MODES = [
  { failure: 'Messaging provider down or delayed', effect: 'Nudges miss their window', handling: 'Fall back to SMS, then IVR; the ladder still ends in a hub call before dispatch. Nothing is cancelled without a reply.' },
  { failure: 'IVR call fails or no keypress', effect: 'No answer recorded at T-2h', handling: 'Treated as "no reply": the hub calls before dispatch, and the order still ships by default.' },
  { failure: 'Masked-call provider down', effect: 'Riders cannot log calls', handling: '"Unavailable" marks go to hub review instead of auto-rejection, so riders are not penalised for an outage.' },
  { failure: 'Reply arrives after cancellation or dispatch', effect: 'Stale reply', handling: 'Replies are checked against the current order state; late replies are logged, not applied.' },
  { failure: 'Duplicate or out-of-order events', effect: 'Double nudges or wrong state', handling: 'Idempotency key per event (order_id + type + step); state transitions only move forward.' },
  { failure: 'Risk service unavailable', effect: 'No score', handling: 'Default to the ladder for every COD order, which is the conservative fallback.' },
  { failure: 'Resale invoice cannot be generated', effect: 'Resale blocked', handling: 'Parcel reverts to standard RTO; the original return path is unchanged.' },
]
