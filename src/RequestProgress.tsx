import {
  ClipboardText,
  IdentificationCard,
  ShieldCheck,
  User,
  Sparkle,
  FileText,
} from '@phosphor-icons/react'
import { useLanguage } from './language-context'

const requestSteps = [
  { label: 'Inquiry Created', codes: [751820006, 751820007, 751820020], icon: ClipboardText },
  { label: 'ICP Verification', codes: [751820017], icon: IdentificationCard },
  { label: 'DOH Review', codes: [751820018], icon: ShieldCheck },
  { label: 'KYC Info Required', codes: [751820019], icon: User },
  { label: 'AI Processing', codes: [751820001, 751820008], icon: Sparkle },
  { label: 'Awaiting Review', codes: [751820009, 751820016], icon: FileText },
]

export function RequestProgress({ status }: { status?: number }) {
  const { t } = useLanguage()
  const current = requestSteps.findIndex((step) => step.codes.includes(Number(status)))
  return (
    <section className="request-progress" aria-label={t('Request progress')}>
      <div className="request-progress-heading">
        <h3>{t('Request progress')}</h3>
        <span>{current < 0 ? t('Status unavailable') : t(requestSteps[current].label)}</span>
      </div>
      <ol>
        {requestSteps.map((step, index) => {
          const Icon = step.icon
          const state = index === current ? 'current' : index < current ? 'reached' : 'upcoming'
          return (
            <li
              key={step.label}
              className={state}
              aria-current={index === current ? 'step' : undefined}
            >
              <span className="request-progress-marker">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="request-progress-label">{t(step.label)}</span>
              <span className="sr-only">
                {t(
                  state === 'current'
                    ? 'Current step'
                    : state === 'reached'
                      ? 'Previous step'
                      : 'Upcoming',
                )}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
