import type { ReactNode } from 'react'

export function Phone({ children, label }: { children: ReactNode; label: string }) {
  return (
    <figure aria-label={label} className="mx-auto w-full max-w-[360px] rounded-[2.5rem] bg-[#1d1520] p-3 shadow-card">
      <div className="relative h-[540px] sm:h-[600px] overflow-hidden rounded-[2rem] bg-[#ECE5DD] flex flex-col">
        <div aria-hidden className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-[#1d1520] z-10" />
        {children}
      </div>
    </figure>
  )
}
