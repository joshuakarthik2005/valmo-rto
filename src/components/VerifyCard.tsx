import { Fragment } from 'react'
import qrLive from '../generated/qr-live.svg?raw'
import { LINKS } from '../data/links'

const ITEMS = [
  { label: 'Code', href: LINKS.repo, external: true },
  { label: 'Tests', href: LINKS.tests, external: true },
  { label: 'Replay', href: LINKS.replay, external: false },
  { label: 'Design boards', href: LINKS.designBoards, external: true },
]

/** "github.com/owner/repo" that can break only after a slash: each segment is non-breaking (so not at the hyphen). */
function BreakAtSlashes({ text }: { text: string }) {
  const parts = text.split('/')
  return (
    <>
      {parts.map((p, n) => (
        <Fragment key={n}>
          <span className="whitespace-nowrap">{p}{n < parts.length - 1 && '/'}</span>
          {n < parts.length - 1 && <wbr />}
        </Fragment>
      ))}
    </>
  )
}

export function VerifyCard({ compact = false }: { compact?: boolean }) {
  const headingId = compact ? 'verify-h-footer' : 'verify-h'
  return (
    <section aria-labelledby={headingId} data-testid="verify-card" className="rounded-xl2 bg-plum text-cream p-4 sm:p-5 shadow-card">
      <div className="flex items-center gap-5">
        {/* Phone QR only on large screens: on a phone you are already on the site. CSS-only, so no layout shift. */}
        <figure className="hidden lg:flex shrink-0 flex-col items-center gap-1.5" data-testid="phone-qr">
          <span className={`block rounded-2xl bg-white p-2 ${compact ? 'w-24 h-24' : 'w-28 h-28'}`} dangerouslySetInnerHTML={{ __html: qrLive }} role="img" aria-label={`QR code for ${LINKS.liveDisplay}`} />
          <figcaption className="text-sm font-semibold text-cream">Try it on your phone</figcaption>
        </figure>
        <div className="min-w-0">
          <h2 id={headingId} className="font-sans text-lg font-bold text-[#7EE0A6]">Verify it yourself</h2>
          <p className="text-base text-cream/90">Code, tests, guided replay and design boards</p>
          <a href={LINKS.repo} target="_blank" rel="noreferrer" data-testid="repo-link" className="mt-1 inline-block font-mono text-sm text-cream underline decoration-cream/40 underline-offset-4 hover:decoration-cream [overflow-wrap:normal] [word-break:normal]">
            <BreakAtSlashes text={LINKS.repoDisplay} />
          </a>
          <ul className="mt-3 flex flex-wrap gap-2">
            {ITEMS.map((it) => (
              <li key={it.label}>
                <a
                  href={it.href}
                  {...(it.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="chip min-h-[36px] bg-white/10 text-cream hover:bg-white/20 border border-white/20"
                >
                  {it.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
