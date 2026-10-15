import { CaretDown, CurrencyCircleDollar, Info } from '@phosphor-icons/react'
import type { Inquiry } from './health'
import { useLanguage } from './language-context'

export function PremiumBreakdown({ record }: { record: Inquiry }) {
  const { t, locale } = useLanguage()
  const p = record.premium
  const money = (value: number) =>
    'AED ' +
    new Intl.NumberFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  const gross = p ? Math.round((p.base + p.additional) * 100) / 100 : 0
  const tax = p ? Math.round(gross * p.taxPercent) / 100 : 0
  return (
    <details className="premium-breakdown" open>
      <summary>
        <span className="premium-heading">
          <span>
            <CurrencyCircleDollar size={20} />
            {t('Premium breakdown')}
            {record.sample && <small>{t('Sample estimate')}</small>}
          </span>
          <span className="premium-total-label">{t('Total premium to be charged')}</span>
          <strong className={p ? '' : 'premium-pending'} dir={p ? 'ltr' : undefined}>
            {p ? money(gross + tax) : t('Not calculated yet')}
          </strong>
        </span>
        <span className="premium-toggle">
          <CaretDown size={16} />
        </span>
      </summary>
      {p ? (
        <div className="premium-values">
          {[
            ['Base premium', money(p.base)],
            ['Additional premium', money(p.additional)],
            ['Gross premium', money(gross)],
            ['VAT rate', p.taxPercent + '%'],
            ['VAT amount', money(tax)],
            ['Total premium', money(gross + tax)],
          ].map(([label, value]) => (
            <div key={label} className={label === 'Total premium' ? 'premium-grand-total' : ''}>
              <span>{t(label)}</span>
              <strong dir="ltr">{value}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="premium-awaiting">
          {t('The premium breakdown will appear here once your inquiry has been priced.')}
        </p>
      )}
      <p className="premium-disclaimer">
        <Info size={15} />
        <span>
          {t(
            record.sample
              ? 'Illustrative amounts and VAT for this sample only. This is not an insurance quote.'
              : 'No premium has been calculated for this inquiry yet.',
          )}
        </span>
      </p>
    </details>
  )
}
