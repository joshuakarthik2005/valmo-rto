/**
 * Failure-case library (A4). Text only: every ₹ effect is computed by scenarioEffects() in src/lib/model.ts.
 * Event names match the proposed schema on #/architecture. All scenarios are simulated.
 */
import type { scenarioEffects } from '../lib/model'
import { A } from './assumptions'

export type ScenarioKey = keyof ReturnType<typeof scenarioEffects>

export interface Scenario {
  key: ScenarioKey
  title: string
  surface: string
  steps: { event: string; text: string }[]
  endState: string
  effectNote: string
}

export const SCENARIOS: Scenario[] = [
  {
    key: 'noReply',
    title: 'No reply across the whole ladder',
    surface: 'Customer · Hub',
    steps: [
      { event: 'nudge.sent (t48)', text: 'WhatsApp/SMS nudge at T-48h. No reply.' },
      { event: 'nudge.sent (t24)', text: 'Delivery-window message at T-24h. No reply.' },
      { event: 'nudge.sent (ivr)', text: 'Automated IVR call at T-2h. No keypress.' },
      { event: 'nudge.sent (hub_call)', text: 'The hub calls before dispatch. No answer.' },
    ],
    endState: 'Dispatched as planned. Silence never cancels an order.',
    effectNote: 'Only the messaging and IVR spend for this order; no saving is counted.',
  },
  {
    key: 'ivrFail',
    title: 'IVR call fails',
    surface: 'Customer · Hub',
    steps: [
      { event: 'nudge.sent (t48, t24)', text: 'Earlier nudges unanswered.' },
      { event: 'nudge.sent (ivr)', text: 'The IVR call fails to connect or records no keypress.' },
      { event: 'nudge.sent (hub_call)', text: 'Treated exactly like "no reply": the hub calls before dispatch.' },
    ],
    endState: 'Dispatched as planned. An IVR fault never blocks delivery.',
    effectNote: 'Same as "no reply": messaging spend only, no saving counted.',
  },
  {
    key: 'lateReply',
    title: 'Customer replies after cancelling',
    surface: 'Customer',
    steps: [
      { event: 'reply.received (cancel)', text: 'The customer cancels before dispatch; the order is not shipped.' },
      { event: 'reply.received (confirm)', text: 'A later "yes, deliver" arrives on an old message.' },
      { event: '(logged, not applied)', text: 'Replies are checked against the current order state. The cancellation stands; the customer is told how to reorder.' },
    ],
    endState: 'Order stays cancelled. No parcel moves.',
    effectNote: 'The cancellation already avoided both legs: a per-case ceiling, never added to the Move 1 total.',
  },
  {
    key: 'riderOffline',
    title: 'Rider offline (no masked calls possible)',
    surface: 'Rider · Hub',
    steps: [
      { event: 'attempt.call_logged', text: 'The rider has no signal or the masked-call service is down, so no call can be logged.' },
      { event: 'attempt.marked (unavailable)', text: 'The rider marks the customer unavailable.' },
      { event: 'attempt.checked (review)', text: 'Without a call log the mark goes to hub review, not auto-rejection, so riders are not penalised for an outage.' },
    ],
    endState: 'Hub reviews the mark; the parcel is reattempted or returned as today.',
    effectNote: 'No saving. The standard attempt fee (a placeholder assumption) stays protected while the hub reviews.',
  },
  {
    key: 'sameDeviceBlocked',
    title: 'Same-device resale buyer blocked',
    surface: 'Hub resale',
    steps: [
      { event: 'rto.received_at_hub', text: 'A refused parcel passes the eligibility check.' },
      { event: 'resale.decided (blocked)', text: 'The nearest interested buyer uses the same device as the customer who refused it, so they are blocked.' },
      { event: 'resale.decided (matched)', text: 'The next nearby buyer is matched instead.' },
    ],
    endState: 'Resold to a different buyer; next-day local delivery.',
    effectNote: 'The normal resale saving per parcel: return leg avoided, minus handling and the buyer discount.',
  },
  {
    key: 'buyerCancels',
    title: 'Resale buyer cancels',
    surface: 'Hub resale',
    steps: [
      { event: 'resale.decided (matched)', text: 'A nearby buyer is matched and the parcel is re-bagged.' },
      { event: 'reply.received (cancel)', text: 'The buyer cancels before delivery.' },
      { event: 'resale.decided (reverted)', text: 'No other buyer within the window, so the parcel reverts to standard RTO.' },
    ],
    endState: 'Standard RTO to the seller, as today.',
    effectNote: 'Worse than today by the re-bagging already spent.',
  },
  {
    key: 'timeout',
    title: `No buyer within ${A.m2WindowDays.value} business days`,
    surface: 'Hub resale',
    steps: [
      { event: 'rto.received_at_hub', text: 'An eligible parcel goes on the resale shelf.' },
      { event: '(no match)', text: 'No nearby buyer is found within the window.' },
      { event: 'resale.decided (reverted)', text: 'The parcel reverts to standard RTO, well inside the return policy.' },
    ],
    endState: 'Standard RTO to the seller, as today.',
    effectNote: 'No gain and no loss compared with today.',
  },
]
