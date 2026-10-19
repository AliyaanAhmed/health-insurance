import { WarningCircle } from '@phosphor-icons/react'
import { CustomSelect } from './CustomSelect'
import { useHealthIntegration } from './healthIntegrationContext'
import { useLanguage } from './language-context'
export function HealthCatalogStatus() {
  const { t } = useLanguage()
  const { loading, error, retry, catalog, plan, selectPlan } = useHealthIntegration()
  if (loading) return null
  if (error)
    return (
      <div className="catalog-status catalog-error" role="alert">
        <WarningCircle size={18} />
        <div>
          <strong>{t('Insurance information could not be loaded.')}</strong>
        </div>
        <button type="button" onClick={retry}>
          {t('Retry')}
        </button>
      </div>
    )
  if (catalog && catalog.plans.length > 1)
    return (
      <div className="catalog-plan">
        <label>{t('Insurance plan')}</label>
        <CustomSelect
          label="Insurance plan"
          placeholder="Choose your plan"
          value={plan?.id ?? ''}
          onChange={selectPlan}
          options={catalog.plans.map((item) => ({ value: item.id, label: item.name }))}
        />
      </div>
    )
  return null
}
