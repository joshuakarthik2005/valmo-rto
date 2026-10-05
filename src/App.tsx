import { lazy, Suspense, useEffect } from 'react'
import { useRoute } from './lib/router'
import { Shell } from './components/Shell'
import Landing from './surfaces/Landing'

// framer-motion loads with the first interactive surface, not with the landing page
const MotionBoundary = lazy(() => import('./components/MotionBoundary'))

const PAGES: Record<string, ReturnType<typeof lazy>> = {
  '/customer': lazy(() => import('./surfaces/Customer')),
  '/rider': lazy(() => import('./surfaces/Rider')),
  '/hub': lazy(() => import('./surfaces/Hub')),
  '/resale': lazy(() => import('./surfaces/Resale')),
  '/impact': lazy(() => import('./surfaces/Impact')),
  '/pilot': lazy(() => import('./surfaces/Pilot')),
  '/demo': lazy(() => import('./surfaces/Demo')),
}
const OgCard = lazy(() => import('./surfaces/OgCard'))

const TITLES: Record<string, string> = {
  '/': 'Home', '/customer': 'Customer', '/rider': 'Rider app', '/hub': 'Hub control tower',
  '/resale': 'Hub resale', '/impact': 'Impact simulator', '/pilot': 'Pilot plan', '/demo': 'Guided demo',
}

export function App() {
  const { path } = useRoute()
  const Page = PAGES[path]
  useEffect(() => {
    document.title = `${TITLES[path] ?? 'Not found'} · Route Cause (prototype)`
    window.scrollTo(0, 0)
  }, [path])
  if (path === '/og') return <Suspense fallback={null}><OgCard /></Suspense>
  return (
    <>
      <Shell path={path} hideFooterCard={path === '/'}>
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
