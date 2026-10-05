import type { ReactNode } from 'react'
import { SURFACES } from '../data/surfaces'
import { SimBadge } from './ui'
import { VerifyCard } from './VerifyCard'

export function Wordmark() {
  return (
    <a href="#/" className="flex items-baseline gap-1.5 font-display text-xl font-bold text-plum whitespace-nowrap" aria-label="Route Cause home">
      <span>Meesho</span>
      <span aria-hidden className="text-coral">×</span>
      <span className="sr-only">by</span>
      <span>Valmo</span>
      <span className="ml-1 hidden sm:inline font-sans text-sm font-semibold text-ink-soft">Route Cause</span>
    </a>
  )
}

export function Shell({ path, children, hideFooterCard = false }: { path: string; children: ReactNode; hideFooterCard?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }} className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 btn-plum">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-plum/10">
        <div className="mx-auto max-w-6xl px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Wordmark />
          <SimBadge className="ml-auto" />
          <nav aria-label="Surfaces" className="w-full lg:w-auto lg:order-none -mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto">
            <ul className="flex gap-1.5 py-0.5">
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
