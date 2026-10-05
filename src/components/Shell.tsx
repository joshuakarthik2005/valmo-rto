import type { ReactNode } from 'react'
import { SURFACES } from '../data/surfaces'
import { SimBadge } from './ui'
import { VerifyCard } from './VerifyCard'

export function Wordmark() {
  return (
    <a href="#/" className="flex items-baseline gap-1.5 font-display text-lg sm:text-xl font-bold text-plum whitespace-nowrap">
      <span>Meesho</span>
      <span aria-hidden className="text-coral">×</span>
      <span className="sr-only">by</span>
      <span>Valmo</span>
      {/* Says plainly that this is a team prototype, not official co-branding */}
      <span className="ml-1.5 self-center rounded-full bg-plum-100 px-2 py-0.5 font-sans text-xs font-semibold text-plum" data-testid="prototype-tag">Route Cause prototype</span>
    </a>
  )
}

export function Shell({ path, children, hideFooterCard = false }: { path: string; children: ReactNode; hideFooterCard?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }} className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 btn-plum">
        Skip to content
      </a>
      {/* Sticky from 640 px up; on phones the wrapped two-row nav scrolls away instead of covering the page */}
      <header className="sm:sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-plum/10">
        <div className="mx-auto max-w-6xl px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Wordmark />
          <SimBadge className="ml-auto" />
          <nav aria-label="Surfaces" className="w-full lg:w-auto lg:order-none sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0 sm:overflow-x-auto">
            {/* Phones: every surface wraps into view (no hidden, sideways-scrolling links) */}
            <ul className="flex flex-wrap sm:flex-nowrap gap-1.5 py-0.5">
              {SURFACES.map((s) => {
                const active = path.startsWith(s.path)
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.path}`}
                      aria-current={active ? 'page' : undefined}
                      className={`chip min-h-[40px] whitespace-nowrap ${active ? 'bg-plum text-cream' : 'bg-white text-plum hover:bg-plum-100'}`}
                    >
                      {s.label}
                    </a>
                  </li>
                )
              })}
              <li>
                <a href="#/demo" aria-current={path === '/demo' ? 'page' : undefined} className={`chip min-h-[40px] whitespace-nowrap ${path === '/demo' ? 'bg-magenta text-white' : 'bg-magenta-100 text-magenta-600 hover:bg-magenta hover:text-white'}`}>
                  ▶ Demo
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:py-10 outline-none">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 pb-8 space-y-4">
        {!hideFooterCard && <VerifyCard compact />}
        <p className="text-sm text-ink-soft">
          Team prototype for Meesho DICE Challenge S3 (Business Track). All orders, people and figures on screen are simulated. Not an official Meesho or Valmo product; no integration is implied.
        </p>
      </footer>
    </div>
  )
}
