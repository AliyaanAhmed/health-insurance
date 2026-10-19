import { useEffect, useMemo, useState } from 'react'
import type { Draft } from './health'
import { buildCustomerData } from './healthPricing'
import type { HealthCatalog } from './healthPricing'
import { loadHealthCatalog } from './powerPagesApi'

export function useHealthCatalog(draft: Draft, mode: 'create' | 'requests' | 'idle') {
  const [catalog, setCatalog] = useState<HealthCatalog | null>(null)
  const [planId, setPlanId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (mode === 'idle') return
    let cancelled = false
    setLoading(true)
    setError('')
    loadHealthCatalog()
      .then((result) => {
        if (cancelled) return
        setCatalog(result)
        setPlanId((current) =>
          result.plans.some((plan) => plan.id === current)
            ? current
            : result.plans.length === 1
              ? result.plans[0].id
              : '',
        )
      })
      .catch((reason) => {
        if (!cancelled) {
          setCatalog(null)
          setError(
            reason instanceof Error ? reason.message : 'Unable to load insurance information.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [mode, revision])
  const plan = catalog?.plans.find((item) => item.id === planId) ?? null
  const customerData = useMemo(
    () => buildCustomerData(draft, catalog, plan),
    [draft, catalog, plan],
  )
  const customerDataJson = useMemo(() => JSON.stringify(customerData), [customerData])
  return {
    catalog,
    plan,
    customerData,
    customerDataJson,
    loading,
    error,
    retry: () => setRevision((current) => current + 1),
    selectPlan: setPlanId,
  }
}
