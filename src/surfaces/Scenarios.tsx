import { useState } from 'react'
import { PageHeader, SimBadge, Callout } from '../components/ui'
import { SCENARIOS, type ScenarioKey } from '../data/scenarios'
import { scenarioEffects, rupees, rupeesFine, defaultInputs } from '../lib/model'

const effects = scenarioEffects()
const inputs = defaultInputs()


export default function Scenarios() {
  const [key, setKey] = useState<ScenarioKey>(SCENARIOS[0].key)
  const s = SCENARIOS.find((x) => x.key === key)!
  const e = effects[key]
  const label = e.kind === 'upTo' ? 'Avoided, per case (ceiling)' : e.kind === 'cost' ? 'Cost for this order, no saving counted' : 'Effect on this order vs today'

  return (
    <div>
      <PageHeader
        eyebrow="Failure cases"
        title="What happens when things go wrong"
        lede="Seven ways the flow can break, what the system does, where the order ends up, and what it costs, compared with today's process for the same order."
      >
        <SimBadge className="mt-3" />
      </PageHeader>
      <Callout>
        <p>Every scenario is <strong>simulated</strong>, and every rupee effect is computed by the model from the same assumptions as the impact page. Event names match the proposed schema on the <a className="underline font-semibold text-plum" href="#/architecture">architecture page</a>.</p>
      </Callout>

      <div className="mt-6 grid lg:grid-cols-[18rem_1fr] gap-6 items-start">
        <nav aria-label="Failure cases">
          <ul className="flex flex-col gap-2" role="list">
            {SCENARIOS.map((x, n) => (
              <li key={x.key}>
                <button onClick={() => setKey(x.key)} aria-pressed={key === x.key}
                  className={`w-full text-left rounded-xl px-4 py-3 min-h-[44px] font-semibold ${key === x.key ? 'bg-plum text-cream' : 'bg-white text-plum hover:bg-plum-100'}`}>
                  <span className="mr-2 text-sm opacity-80">{n + 1}.</span>{x.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section className="card" aria-live="polite" aria-labelledby="sc-h" data-testid="scenario">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip bg-coral-100 text-plum">Simulated</span>
            <span className="chip bg-cream-200 text-ink">{s.surface}</span>
          </div>
          <h2 id="sc-h" className="mt-2 text-2xl font-bold">{s.title}</h2>
          <ol className="mt-4 space-y-3">
            {s.steps.map((st) => (
              <li key={st.event + st.text} className="flex gap-3">
                <span aria-hidden className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-magenta" />
                <div>
                  <p className="font-mono text-sm text-plum">{st.event}</p>
                  <p className="text-ink">{st.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-cream p-4">
              <p className="text-ink-soft">End state</p>
              <p className="mt-1 font-semibold text-ink" data-testid="end-state">{s.endState}</p>
            </div>
            <div className="rounded-xl bg-cream p-4">
              <p className="text-ink-soft">{label}</p>
              <p className={`num mt-1 text-3xl font-bold ${e.amount > 0 ? 'text-leaf-700' : e.amount < 0 ? 'text-magenta-600' : 'text-ink'}`} data-testid="effect">
                {e.kind === 'upTo' ? 'up to ' : ''}{rupeesFine(e.amount)}
              </p>
              <p className="mt-1 text-sm text-ink">{s.effectNote}</p>
              {'riderFeeProtected' in e && (
                <p className="mt-1 text-sm text-ink-soft">Attempt fee protected: {rupees(e.riderFeeProtected)} (placeholder assumption; the real rate card is still open).</p>
              )}
            </div>
          </div>
          <p className="mt-4 text-sm text-ink-soft">Per order, compared with today's process. Messaging spend is {rupeesFine(-effects.noReply.amount)} per order ({rupees(inputs.m1MessagingCost)} per lakh orders).</p>
        </section>
      </div>
    </div>
  )
}
