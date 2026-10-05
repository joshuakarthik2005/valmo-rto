import { useEffect, useState } from 'react'

export interface Route { path: string; params: URLSearchParams }

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/'
  const [path, query = ''] = raw.split('?')
  return { path: path || '/', params: new URLSearchParams(query) }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export function navigate(path: string) {
  window.location.hash = path
}

/** Replace query params on the current hash route without adding history entries. */
export function setParams(path: string, params: URLSearchParams) {
  const q = params.toString()
  history.replaceState(null, '', `#${path}${q ? `?${q}` : ''}`)
}
