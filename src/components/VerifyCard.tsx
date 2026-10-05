import qrRepo from '../generated/qr-repo.svg?raw'
import qrLive from '../generated/qr-live.svg?raw'
import { LINKS } from '../data/links'

const ITEMS = [
  { label: 'Code', href: LINKS.repo, external: true },
  { label: 'Tests', href: LINKS.tests, external: true },
  { label: 'Replay', href: LINKS.replay, external: false },
  { label: 'Design boards', href: LINKS.designBoards, external: true },
]

export function VerifyCard({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-labelledby={compact ? undefined : 'verify-h'} aria-label={compact ? 'Verify it yourself' : undefined} className="rounded-xl2 bg-plum text-cream p-4 sm:p-5 shadow-card">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="flex items-end gap-3 shrink-0">
          <a href={LINKS.repo} className="block rounded-2xl bg-white p-2" aria-label={`Scan or open ${LINKS.repoDisplay}`}>
            <span className={`block ${compact ? 'w-20 h-20' : 'w-28 h-28'}`} dangerouslySetInnerHTML={{ __html: qrRepo }} />
          </a>
          {!compact && (
            <a href={LINKS.live} className="flex flex-col items-center gap-1 text-center" aria-label={`Open the live prototype at ${LINKS.liveDisplay}`}>
              <span className="block w-16 h-16 rounded-xl bg-white p-1.5" dangerouslySetInnerHTML={{ __html: qrLive }} />
              <span className="text-xs leading-tight text-cream/90 max-w-[5.5rem]">Open the live prototype</span>
            </a>
          )}
        </div>
        <div className="min-w-0">
          <h2 id={compact ? undefined : 'verify-h'} className="font-sans text-lg font-bold text-[#7EE0A6]">Verify it yourself</h2>
          <p className="text-base text-cream/90">Code, tests, guided replay and design boards</p>
          <p className="mt-1 font-mono text-sm break-all text-cream">{LINKS.repoDisplay}</p>
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
