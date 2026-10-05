import type { ReactNode } from 'react'
import { SOURCE_LABEL, type SourceTag } from '../data/assumptions'

export function SimBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`chip bg-coral-100 text-plum border border-coral ${className}`} role="note">
      <span aria-hidden className="h-2 w-2 rounded-full bg-coral" />
      Prototype: simulated data
    </span>
  )
}

const TAG_STYLE: Record<SourceTag, string> = {
  case: 'bg-plum-100 text-plum',
  primary: 'bg-magenta-100 text-magenta-600',
  assumption: 'bg-cream-200 text-ink-soft',
}

export function SourcePill({ tag }: { tag: SourceTag }) {
  return <span className={`chip text-xs ${TAG_STYLE[tag]}`}>{SOURCE_LABEL[tag]}</span>
}

export function PageHeader({ eyebrow, title, lede, children }: { eyebrow: string; title: string; lede: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 sm:mb-8 max-w-3xl">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-1 text-3xl sm:text-4xl font-bold">{title}</h1>
      <p className="mt-3 text-lg text-ink-soft">{lede}</p>
      {children}
    </header>
  )
}

export function Stat({ label, value, tone = 'plum', sub }: { label: string; value: ReactNode; tone?: 'plum' | 'leaf' | 'magenta'; sub?: ReactNode }) {
  const color = { plum: 'text-plum', leaf: 'text-leaf-700', magenta: 'text-magenta-600' }[tone]
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className={`num mt-1 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-sm text-ink-soft">{sub}</p>}
    </div>
  )
}

export function Callout({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'good'; children: ReactNode }) {
  const s = { info: 'bg-plum-100 border-plum/30', warn: 'bg-coral-100 border-coral', good: 'bg-leaf-100 border-leaf' }[tone]
  return <div className={`rounded-2xl border p-4 text-base ${s}`}>{children}</div>
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-white p-1 shadow-card">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-[40px] rounded-full px-4 text-sm font-semibold transition-colors ${value === o.value ? 'bg-plum text-cream' : 'text-plum hover:bg-plum-100'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
