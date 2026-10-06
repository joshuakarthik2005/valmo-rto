import { lazy, Suspense, useEffect, type ComponentType } from 'react'
import { useRoute } from './lib/router'
import { Shell } from './components/Shell'
import Landing from './surfaces/Landing'

// framer-motion loads with the first interactive surface, not with the landing page
const loadMotion = () => import('./components/MotionBoundary')
const MotionBoundary = lazy(loadMotion)

const LOADERS = {
  '/customer': () => import('./surfaces/Customer'),
  '/rider': () => import('./surfaces/Rider'),
  '/hub': () => import('./surfaces/Hub'),
  '/resale': () => import('./surfaces/Resale'),
  '/impact': () => import('./surfaces/Impact'),
  '/pilot': () => import('./surfaces/Pilot'),
  '/demo': () => import('./surfaces/Demo'),
  '/architecture': () => import('./surfaces/Architecture'),
} as Record<string, () => Promise<{ default: ComponentType }>>
const PAGES = Object.fromEntries(Object.entries(LOADERS).map(([k, f]) => [k, lazy(f)]))
const OgCard = lazy(() => import('./surfaces/OgCard'))

const TITLES: Record<string, string> = {
  '/': 'Home', '/customer': 'Customer', '/rider': 'Rider app', '/hub': 'Hub control tower',
  '/resale': 'Hub resale', '/impact': 'Impact simulator', '/pilot': 'Pilot plan', '/demo': 'Guided demo', '/architecture': 'Architecture',
}

export function App() {
  const { path } = useRoute()
  const Page = PAGES[path]
  // Start the surface and motion chunks together instead of one after the other
  if (path in LOADERS) { void LOADERS[path](); void loadMotion() }
  useEffect(() => {
    document.title = `${TITLES[path] ?? 'Not found'} · Route Cause (prototype)`
    window.scrollTo(0, 0)
  }, [path])
  if (path === '/og') return <Suspense fallback={null}><OgCard /></Suspense>
  return (
    <>
      {/* The demo's last step shows the Verify card itself, so the footer copy is hidden there (one landmark, not two) */}
      <Shell path={path} hideFooterCard={path === '/' || path === '/demo'}>
        {path === '/' ? (
          <Landing />
        ) : Page ? (
          <Suspense fallback={<p className="min-h-[100svh] text-ink-soft" role="status">Loading…</p>}>
            <MotionBoundary><Page /></MotionBoundary>
          </Suspense>
        ) : (
          <div className="card max-w-lg">
            <h1 className="text-2xl font-bold">Page not found</h1>
            <a href="#/" className="btn-plum mt-4">Back to home</a>
          </div>
        )}
      </Shell>
    </>
  )
}
