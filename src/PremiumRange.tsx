import { useEffect, useState } from 'react'
import { Info, Users, WarningCircle } from '@phosphor-icons/react'
import { useHealthIntegration } from './healthIntegrationContext'
import { useLanguage } from './language-context'

function AnimatedRange({ amount, locale }: { amount: number | null; locale: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const target = amount ?? 0
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(target)
      return
    }
    setDisplay(0)
    if (target <= 0) return
    const steps = Math.ceil(target / 50)
    let value = 0
    const timer = window.setInterval(
      () => {
        value = Math.min(target, value + 50)
        setDisplay(value)
        if (value === target) window.clearInterval(timer)
      },
      Math.max(4, Math.min(20, 900 / steps)),
    )
    // Cap the duration even for unusually large premiums or throttled timers.
    const finish = window.setTimeout(() => {
      window.clearInterval(timer)
      setDisplay(target)
    }, 900)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(finish)
    }
  }, [amount])
  const format = (value: number) =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  const minimum = (value: number) => Math.round(value * 90) / 100
  return (
    <>
      <span className="estimate-range-endpoint" aria-hidden="true">
        {amount === null ? '\u2014' : format(minimum(display))}
      </span>
      <span className="estimate-range-separator" aria-hidden="true">
        –
      </span>
      <span className="estimate-range-endpoint" aria-hidden="true">
        {amount === null ? '\u2014' : format(display)}
      </span>
      <span className="sr-only">
        {amount === null ? '\u2014' : `${format(minimum(amount))} – ${format(amount)}`}
      </span>
    </>
  )
}

export function PremiumRange() {
  const { t, locale } = useLanguage()
  const { customerData, loading, error, retry } = useHealthIntegration()
  const { premium } = customerData
  const people = [customerData.applicant, ...customerData.members].filter(
    (person) => person.insured,
  )
  const needsReview = people.some(
    (person) =>
      person.premiumStatus === 'missing-rate' || person.premiumStatus === 'ambiguous-rate',
  )
  const amount = premium.pricedPeople ? premium.partialGrossPremium : null
  const updateKey = `${amount}:${premium.pricedPeople}`
  return (
    <section
      className={`quote-premium-range premium-estimate${amount === null ? ' premium-estimate-empty' : ''}`}
      aria-labelledby="premium-range-heading"
      aria-busy={loading}
    >
      <div className="estimate-heading">
        <h3 id="premium-range-heading">{t('Premium range')}</h3>
        <span>{t('Annual estimate')}</span>
      </div>
      <div className="estimate-value estimate-value-range" dir="ltr">
        <span>AED</span>
        <output aria-live="polite" aria-atomic="true">
          <AnimatedRange key={updateKey} amount={amount} locale={locale} />
        </output>
      </div>
      {amount !== null && (
        <div key={updateKey} className="estimate-range-track" aria-hidden="true">
          <span />
          <span />
        </div>
      )}
      {premium.pricedPeople > 0 && (
        <div className="estimate-caption">
          <span key={updateKey} className="estimate-person-count">
            <Users size={14} aria-hidden="true" />
            {premium.pricedPeople}{' '}
            {t(premium.pricedPeople === 1 ? 'person included' : 'people included')}
          </span>
        </div>
      )}
      {error && (
        <div className="premium-rate-error">
          <WarningCircle size={14} />
          <span>{t('Your estimate is temporarily unavailable.')}</span>
          <button type="button" onClick={retry}>
            {t('Retry')}
          </button>
        </div>
      )}
      {!loading && !error && needsReview && (
        <p className="estimate-review" role="status">
          {t('Some cover options need a quick review.')}
        </p>
      )}
      <p className="estimate-disclaimer">
        <Info size={14} aria-hidden="true" />
        <span>{t('The final quote will be dependent on DOH checks and KYC for each member.')}</span>
      </p>
    </section>
  )
}
