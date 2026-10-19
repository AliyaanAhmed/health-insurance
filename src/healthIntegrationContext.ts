import { useContext, createContext } from 'react'
import type { CustomerData, HealthCatalog, HealthPlan } from './healthPricing'
export interface IntegrationState {
  catalog: HealthCatalog | null
  plan: HealthPlan | null
  customerData: CustomerData
  customerDataJson: string
  loading: boolean
  error: string
  retry: () => void
  selectPlan: (id: string) => void
}
export const HealthIntegrationContext = createContext<IntegrationState | null>(null)
export function useHealthIntegration() {
  const context = useContext(HealthIntegrationContext)
  if (!context) throw new Error('Health integration provider is missing.')
  return context
}
