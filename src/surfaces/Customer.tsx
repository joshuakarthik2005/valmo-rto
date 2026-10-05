import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Phone } from '../components/Phone'
import { PageHeader, Segmented, Callout } from '../components/ui'
import { COPY, LANGS, type Lang, type OrderCtx } from '../data/copy'
import { ORDERS, SLOTS, HUB } from '../data/scenario'
import { replyValue, upiSwitch, rupees, defaultInputs, type Reply } from '../lib/model'
import { A } from '../data/assumptions'

const order = ORDERS[0]
const inputs = defaultInputs()

const LADDER = [
  { key: 't48', when: 'T-48h', title: 'WhatsApp / SMS nudge', body: 'One-tap reply buttons.' },
  { key: 't24', when: 'T-24h', title: 'Delivery window', body: 'Exact slot, with options to move it.' },
  { key: 'ivr', when: 'T-2h', title: 'Automated IVR call', body: 'Press 1, 2 or 3. Works on any phone.' },
  { key: 'hub', when: 'Before dispatch', title: 'Hub calls', body: 'Still no reply: a person calls before the parcel leaves.' },
] as const

type BotMsg = 't48' | 't24' | 'ivr' | 'hub' | 'confirmAck' | 'rescheduleAsk' | 'cancelAck' | 'notMineAck' | 'upiOffer' | 'upiAck'
type Ev =
  | { k: 'bot'; msg: BotMsg }
  | { k: 'botSlot'; slot: string }
  | { k: 'me'; reply: Reply | 'slot'; slot?: string }

type Status = 'waiting' | 'confirmed' | 'rescheduled' | 'cancelled' | 'held'

const VALUE_LABEL: Record<Reply, string> = {
  confirm: 'Counted value of this reply',
  reschedule: 'Counted value of this reply',
  upi: 'Expected saving per switch',
  cancel: 'Avoided cost, per case',
  notMine: 'Avoided cost, per case',
}

export default function Customer() {
  const [lang, setLang] = useState<Lang>('en')
  const [view, setView] = useState<'chat' | 'app'>('chat')
  const [step, setStep] = useState(0)
  const [events, setEvents] = useState<Ev[]>([{ k: 'bot', msg: 't48' }])
  const [status, setStatus] = useState<Status>('waiting')
  const [picking, setPicking] = useState(false)
  const [paidUpi, setPaidUpi] = useState(false)
  const [last, setLast] = useState<Reply | null>(null)
  const [slot, setSlot] = useState<string>(SLOTS[0])

  const c = COPY[lang]
  const [day, time] = SLOTS[0].split(', ')
  const ctx: OrderCtx = useMemo(() => ({
    name: order.name, id: order.id, item: order.item,
    amount: rupees(order.price), day, slot: time,
    upiPrice: rupees(order.price - inputs.upiDiscount), upiOff: rupees(inputs.upiDiscount),
  }), [day, time])

  const push = (...e: Ev[]) => setEvents((x) => [...x, ...e])
  const closed = status === 'cancelled' || status === 'held'

  function noReply() {
    if (step >= LADDER.length - 1 || status !== 'waiting') return
    const n = step + 1
    setStep(n)
    push({ k: 'bot', msg: LADDER[n].key })
  }

  function reply(r: Reply) {
    setLast(r)
    setPicking(false)
    if (r === 'confirm') { setStatus('confirmed'); push({ k: 'me', reply: r }, { k: 'bot', msg: 'confirmAck' }) }
    if (r === 'reschedule') { setPicking(true); push({ k: 'me', reply: r }, { k: 'bot', msg: 'rescheduleAsk' }) }
    if (r === 'cancel') { setStatus('cancelled'); push({ k: 'me', reply: r }, { k: 'bot', msg: 'cancelAck' }) }
    if (r === 'notMine') { setStatus('held'); push({ k: 'me', reply: r }, { k: 'bot', msg: 'notMineAck' }) }
    if (r === 'upi') { setPaidUpi(true); push({ k: 'me', reply: r }, { k: 'bot', msg: 'upiAck' }) }
  }

  function pickSlot(s: string) {
    setSlot(s); setPicking(false); setStatus('rescheduled')
    push({ k: 'me', reply: 'slot', slot: s }, { k: 'botSlot', slot: s }, { k: 'bot', msg: 'upiOffer' })
  }

  function reset() {
    setStep(0); setEvents([{ k: 'bot', msg: 't48' }]); setStatus('waiting'); setPicking(false); setPaidUpi(false); setLast(null); setSlot(SLOTS[0])
  }

  const meText = (e: Extract<Ev, { k: 'me' }>) =>
    e.reply === 'slot' ? e.slot! : e.reply === 'upi' ? c.btn.upi(ctx) : c.btn[e.reply]
  const botText = (e: Ev) => {
    if (e.k === 'botSlot') return c.rescheduleAck(ctx, e.slot)
    if (e.k === 'bot') return c[e.msg](ctx)
    return ''
  }

  const actions = (
    <ReplyButtons c={c} ctx={ctx} picking={picking} status={status} paidUpi={paidUpi} onReply={reply} onSlot={pickSlot} />
  )

  const v = last ? replyValue(last) : null
  const upi = upiSwitch(inputs.upiDiscount)
  const upiAlt = upiSwitch(A.upiDiscountAlt.value)
  const lastBot = [...events].reverse().find((e) => e.k !== 'me')

  return (
    <div>
      <PageHeader
        eyebrow="Surface 1 · Customer · Move 1"
        title="Ask before the parcel leaves the hub"
        lede="Every COD or first-time-address order gets a reconfirmation ladder. Reply as the customer, or let it escalate to see what happens when they stay silent."
      />
      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-6 order-2 lg:order-1">
          <div className="flex flex-wrap gap-3">
            <Segmented label="View" value={view} onChange={setView} options={[{ value: 'chat', label: 'WhatsApp thread' }, { value: 'app', label: 'In-app order' }]} />
            <Segmented label="Language" value={lang} onChange={setLang} options={LANGS.map((l) => ({ value: l.value, label: l.label }))} />
          </div>
          {LANGS.find((l) => l.value === lang)!.needsReview && (
            <Callout tone="warn"><strong>Needs native review.</strong> This translation is a team draft and has not been checked by a native speaker.</Callout>
          )}

          <section aria-labelledby="ladder-h" className="card">
            <h2 id="ladder-h" className="text-xl font-bold">Reconfirmation ladder</h2>
            <ol className="mt-4 space-y-2">
              {LADDER.map((l, n) => {
                const state = n < step ? 'done' : n === step ? (status === 'waiting' ? 'now' : 'answered') : 'next'
                return (
                  <li key={l.key} className={`flex gap-3 rounded-xl p-3 ${state === 'now' ? 'bg-magenta-100' : state === 'answered' ? 'bg-leaf-100' : ''}`}>
                    <span className={`mt-0.5 shrink-0 chip min-w-[4.5rem] justify-center ${state === 'next' ? 'bg-cream-200 text-ink-soft' : 'bg-plum text-cream'}`}>{l.when}</span>
                    <div>
                      <p className="font-semibold text-ink">
                        {l.title}
                        {state === 'now' && <span className="sr-only"> (current step)</span>}
                        {state === 'answered' && <span className="ml-2 text-leaf-700">· answered</span>}
                      </p>
                      <p className="text-ink-soft">{l.body}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="btn-ghost" onClick={noReply} disabled={status !== 'waiting' || step >= LADDER.length - 1} data-testid="no-reply">
                No reply: escalate
              </button>
              <button className="btn-ghost" onClick={reset}>Restart</button>
            </div>
          </section>

          <section aria-live="polite" aria-labelledby="val-h" className="card space-y-3">
            <h2 id="val-h" className="text-xl font-bold">What this reply is worth</h2>
            {!v || !last ? (
              <p className="text-ink-soft">Pick a reply in the phone to see its value.</p>
            ) : (
              <div>
                <p className="text-ink-soft">{VALUE_LABEL[last]}</p>
                <p className="num text-4xl font-bold text-leaf-700" data-testid="reply-value">
                  {v.kind === 'upTo' ? 'up to ' : ''}{rupees(v.amount)}
                  {v.kind === 'expected' && <span className="text-lg font-semibold text-ink-soft"> expected</span>}
                </p>
                <p className="mt-2 text-ink">
                  {last === 'confirm' && 'Nothing is booked as saved per reply. Confirmations feed the Move 1 estimate, which is counted in aggregate on the impact page.'}
                  {last === 'reschedule' && 'A failed first attempt is avoided. It is counted in the Move 1 aggregate, not per reply.'}
                  {last === 'cancel' && `The order never ships, so both legs are avoided: ${rupees(inputs.forwardCost)} forward + ${rupees(inputs.reverseCost)} return. This per-case ceiling is never added to the Move 1 aggregate.`}
                  {last === 'notMine' && `Parcel held, seller alerted, fraud caught before dispatch. Up to ${rupees(inputs.forwardCost + inputs.reverseCost)} avoided, as a per-case ceiling outside the Move 1 aggregate.`}
                  {last === 'upi' && `${Math.round(upi.points * 100)} points lower RTO risk × ${rupees(inputs.reverseCost)} return leg.`}
                </p>
                {v.fraudCaught && <p className="mt-2 chip bg-coral-100 text-plum">Fraud caught</p>}
              </div>
            )}
            {last && last !== 'cancel' && last !== 'notMine' && (
              <Callout tone="warn">
                <p className="font-semibold">Honest maths on the UPI incentive</p>
                <p>
                  At a {rupees(inputs.upiDiscount)} discount the net is <strong className="num">{rupees(upi.net)}</strong> per switch, slightly negative.
                  At {rupees(A.upiDiscountAlt.value)} it is <strong className="num">+{rupees(upiAlt.net)}</strong>. The pilot tests the smaller discount.
                </p>
              </Callout>
            )}
          </section>
        </div>

        <div className="order-1 lg:order-2 lg:sticky lg:top-32">
          {view === 'chat' ? (
            <Phone label="WhatsApp-style reconfirmation thread (mock)">
              <div className="bg-[#075E54] text-white px-4 pt-9 pb-3 flex items-center gap-3">
                <span aria-hidden className="h-9 w-9 rounded-full bg-coral grid place-items-center font-bold text-plum">M</span>
                <div><p className="font-semibold leading-tight">Delivery updates</p><p className="text-sm text-white/90">Mock business chat</p></div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2" lang={lang === 'hi' ? 'hi' : 'en'} aria-live="polite">
                <AnimatePresence initial={false}>
                  {events.map((e, n) => (
                    <motion.div key={n} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-[15px] leading-snug shadow-sm ${e.k === 'me' ? 'ml-auto bg-[#DCF8C6] text-ink' : 'bg-white text-ink'}`}>
                      {e.k === 'me' ? meText(e) : botText(e)}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="bg-[#F0F0F0] p-3">{closed ? <p className="text-center text-sm text-ink-soft">Conversation closed</p> : actions}</div>
            </Phone>
          ) : (
            <Phone label="Meesho-style in-app order screen (mock)">
              <div className="bg-white px-4 pt-9 pb-3 border-b"><p className="font-semibold text-ink">My order</p></div>
              <div className="flex-1 overflow-y-auto bg-[#F5F1F4] p-3 space-y-3" lang={lang === 'hi' ? 'hi' : 'en'}>
                <div className="rounded-xl bg-white p-3 flex gap-3">
                  <div aria-hidden className="h-16 w-16 shrink-0 rounded-lg bg-magenta-100 grid place-items-center text-2xl">👗</div>
                  <div>
                    <p className="font-semibold text-ink">{order.item}</p>
                    <p className="text-sm text-ink-soft">{order.id} · {paidUpi ? 'Paid by UPI' : `${rupees(order.price)} cash on delivery`}</p>
                    <p className="text-sm font-semibold text-plum mt-1">
                      {status === 'waiting' && `Arriving ${SLOTS[0]}`}
                      {status === 'confirmed' && `Confirmed for ${SLOTS[0]}`}
                      {status === 'rescheduled' && `Moved to ${slot}`}
                      {status === 'cancelled' && 'Cancelled before dispatch'}
                      {status === 'held' && `On hold at ${HUB.name} hub`}
                    </p>
                  </div>
                </div>
                <ol className="rounded-xl bg-white p-3 text-sm text-ink space-y-1" aria-label="Order progress">
                  <li>✓ Ordered</li>
                  <li>✓ Packed by seller</li>
                  <li className={status === 'waiting' ? 'font-semibold text-magenta-600' : ''}>{status === 'waiting' ? '● Waiting for your confirmation' : '✓ Delivery confirmed by you'}</li>
                  <li className="text-ink-soft">○ Out for delivery</li>
                </ol>
                {lastBot && (
                  <div className={`rounded-xl bg-white p-3 ${status === 'waiting' ? 'border-2 border-magenta' : ''}`}>
                    <p className="text-ink">{botText(lastBot)}</p>
                  </div>
                )}
                {!closed && actions}
              </div>
            </Phone>
          )}
          <p className="mt-3 text-center text-sm text-ink-soft">Mock interface. Not a real Meesho or WhatsApp screen.</p>
        </div>
      </div>
    </div>
  )
}

function ReplyButtons({ c, ctx, picking, status, paidUpi, onReply, onSlot }: {
  c: (typeof COPY)[Lang]; ctx: OrderCtx; picking: boolean; status: Status; paidUpi: boolean
  onReply: (r: Reply) => void; onSlot: (s: string) => void
}) {
  const btn = 'w-full min-h-[44px] rounded-lg bg-white px-3 text-[15px] font-semibold text-[#075E54] border border-black/10 hover:bg-[#f7f7f7]'
  if (picking) {
    return (
      <div className="grid grid-cols-1 gap-2" role="group" aria-label="Choose a delivery slot">
        {SLOTS.slice(1).map((s) => <button key={s} className={btn} onClick={() => onSlot(s)}>{s}</button>)}
      </div>
    )
  }
  if (status === 'confirmed' || status === 'rescheduled') {
    return paidUpi ? <p className="text-center text-sm text-ink-soft">All set</p> : (
      <button className="w-full min-h-[44px] rounded-lg bg-leaf-700 px-3 text-[15px] font-semibold text-white" onClick={() => onReply('upi')}>{c.btn.upi(ctx)}</button>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Reply options">
      <button className={btn} onClick={() => onReply('confirm')}>{c.btn.confirm}</button>
      <button className={btn} onClick={() => onReply('reschedule')}>{c.btn.reschedule}</button>
      <button className={btn} onClick={() => onReply('cancel')}>{c.btn.cancel}</button>
      <button className={btn} onClick={() => onReply('notMine')}>{c.btn.notMine}</button>
    </div>
  )
}
