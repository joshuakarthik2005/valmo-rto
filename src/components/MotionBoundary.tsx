import type { ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'

/** Honours prefers-reduced-motion for every framer-motion animation below it. */
export default function MotionBoundary({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
