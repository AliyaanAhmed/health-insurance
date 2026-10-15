import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import type { Stage } from './health'

export function useRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || '/')
  useEffect(() => {
    let activeTransition: ReturnType<Document['startViewTransition']> | null = null
    const onChange = () => {
      const nextRoute = window.location.hash.slice(1) || '/'
      activeTransition?.skipTransition()
      const update = () => {
        flushSync(() => setRoute(nextRoute))
        window.scrollTo({ top: 0, behavior: 'instant' })
      }
      if (
        typeof document.startViewTransition !== 'function' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        update()
        return
      }
      // Browser snapshots overlap: navigation has no timer and never empties the form.
      // Keep route-level entrance effects disabled after the first crossfade.
      // Re-enabling them at transition end would replay the new step's animation.
      document.documentElement.dataset.routeMotion = 'crossfade'
      document.documentElement.dataset.routeTransition = 'true'
      const transition = document.startViewTransition(update)
      activeTransition = transition
      void transition.finished
        .catch(() => {})
        .finally(() => {
          if (activeTransition === transition) {
            activeTransition = null
            delete document.documentElement.dataset.routeTransition
          }
        })
    }
    window.addEventListener('hashchange', onChange)
    return () => {
      window.removeEventListener('hashchange', onChange)
      activeTransition?.skipTransition()
      delete document.documentElement.dataset.routeTransition
      delete document.documentElement.dataset.routeMotion
    }
  }, [])
  return route
}
export function navigate(path: string) {
  window.location.hash = path
}
export function stepPath(stage: Stage, group = 0) {
  return `/inquiry/${stage}/${group}`
}
