import { PageHeader, Callout } from '../components/ui'
import { PIPELINE, EVENTS, DATA_NEEDED, INTEGRATIONS, BUILD_VS_INTEGRATE, FAILURE_MODES } from '../data/architecture'

function Confirm() {
  return <span className="chip text-xs bg-coral-100 text-plum whitespace-nowrap">To confirm with Valmo</span>
}

export default function Architecture() {
  return (
    <div>
      <PageHeader
        eyebrow="How it would plug in"
        title="Events in, decisions out"
        lede="A proposal for running Route Cause on Valmo's network: the pipeline, the events it needs, the integrations, what to build and what to reuse, and how it fails safely. No integration exists today."
      />
      <Callout tone="warn">
        <p><strong>Proposal, not a description of Valmo's systems.</strong> Anything that depends on Valmo's internal systems is tagged <Confirm />.</p>
      </Callout>

      <section aria-labelledby="pipe-h" className="mt-6">
        <h2 id="pipe-h" className="text-2xl font-bold">The pipeline</h2>
        <ol className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="pipeline">
          {PIPELINE.map((p, n) => (
            <li key={p.id} className="card relative">
              <p className="chip bg-plum text-cream">Step {n + 1}</p>
              <h3 className="mt-2 text-lg font-bold">{p.title}</h3>
              <p className="mt-1 text-ink">{p.body}</p>
              {p.confirm && <div className="mt-2"><Confirm /></div>}
              {n < PIPELINE.length - 1 && n % 3 !== 2 && <span aria-hidden className="hidden lg:block absolute -right-3 top-1/2 text-2xl text-plum/40">→</span>}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="ev-h" className="card mt-6">
        <h2 id="ev-h" className="text-xl font-bold">Event schema (proposed)</h2>
        <p className="text-ink-soft">Field names are illustrative. Every event carries an idempotency key (order_id + type + step).</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[15px]" data-testid="events">
            <caption className="sr-only">Proposed events with when they fire and their fields</caption>
            <thead className="text-sm text-ink-soft"><tr><th className="py-2 pr-3">Event</th><th className="pr-3">When</th><th className="pr-3">Fields</th><th>Source</th></tr></thead>
            <tbody>
              {EVENTS.map((e) => (
                <tr key={e.name} className="border-t border-plum/10 align-top">
                  <td className="py-2 pr-3 font-mono text-sm text-plum whitespace-nowrap">{e.name}</td>
                  <td className="py-2 pr-3">{e.when}</td>
                  <td className="py-2 pr-3 font-mono text-sm">{e.fields}</td>
                  <td className="py-2">{e.confirm ? <Confirm /> : <span className="text-sm text-ink-soft">Route Cause</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <section aria-labelledby="data-h" className="card">
          <h2 id="data-h" className="text-xl font-bold">Data needed from Valmo</h2>
          <div className="mt-1"><Confirm /></div>
          <ul className="mt-3 space-y-3">
            {DATA_NEEDED.map((d) => (
              <li key={d.item} className="rounded-xl bg-cream p-3">
                <p className="font-semibold text-plum">{d.item}</p>
                <p className="text-ink">{d.detail}</p>
                <p className="text-sm text-ink-soft">Used for: {d.why}</p>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="int-h" className="card">
          <h2 id="int-h" className="text-xl font-bold">Integrations</h2>
          <p className="text-ink-soft">Channel types only. No vendor is assumed; reuse what Meesho already contracts.</p>
          <ul className="mt-3 space-y-3">
            {INTEGRATIONS.map((x) => (
              <li key={x.name} className="rounded-xl border border-plum/15 p-3">
                <p className="font-semibold text-ink">{x.name}</p>
                <p className="text-ink">{x.use}</p>
                <p className="text-sm text-ink-soft">Needs: {x.needs}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="bvi-h" className="card mt-6">
        <h2 id="bvi-h" className="text-xl font-bold">Build or integrate</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left" data-testid="build-vs-integrate">
            <thead className="text-sm text-ink-soft"><tr><th className="py-2 pr-3">Part</th><th className="pr-3">Choice</th><th>Why</th></tr></thead>
            <tbody>
              {BUILD_VS_INTEGRATE.map((b) => (
                <tr key={b.part} className="border-t border-plum/10 align-top">
                  <td className="py-2 pr-3 font-semibold">{b.part}</td>
                  <td className="py-2 pr-3"><span className={`chip ${b.choice.startsWith('Build') ? 'bg-plum-100 text-plum' : 'bg-leaf-100 text-leaf-700'}`}>{b.choice}</span></td>
                  <td className="py-2">{b.why}{b.confirm && <span className="ml-2 inline-block align-middle"><Confirm /></span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="fail-h" className="card mt-6">
        <h2 id="fail-h" className="text-xl font-bold">Failure modes and safe defaults</h2>
        <p className="text-ink-soft">The rule throughout: when something fails, the order ships as it would today, so a fault never makes delivery worse.</p>
        <ul className="mt-3 grid md:grid-cols-2 gap-3" data-testid="failure-modes">
          {FAILURE_MODES.map((f) => (
            <li key={f.failure} className="rounded-xl bg-cream p-3">
              <p className="font-semibold text-ink">{f.failure}</p>
              <p className="text-sm text-magenta-600">{f.effect}</p>
              <p className="mt-1 text-ink">{f.handling}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
