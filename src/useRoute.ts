import { useEffect, useState } from 'react'
import type { Stage } from './health'
export function useRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/')
  useEffect(() => {
    const onChange = () => setRoute(window.location.hash.slice(1) || '/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
export function navigate(path: string) {
  window.location.hash = path
}
export function stepPath(stage: Stage, group = 0) {
  return `/inquiry/${stage}/${group}`
}
