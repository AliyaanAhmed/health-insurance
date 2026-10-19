import { Heartbeat } from '@phosphor-icons/react'
import { useLanguage } from './language-context'

/** Shared screen loader; mount only while a page transition or request is pending. */
export function PageLoader({
  label = 'Opening your inquiry',
  description = 'Your cover details, coming together.',
  allowBack = true,
  visualOnly = false,
  embedded = false,
}: {
  label?: string
  description?: string
  allowBack?: boolean
  visualOnly?: boolean
  embedded?: boolean
}) {
  const { t } = useLanguage()
  const Heading = embedded ? 'h2' : 'h1'
  return (
    <div
      className={`page-loader${embedded ? ' page-loader-embedded' : ''}`}
      id={embedded ? undefined : 'main-content'}
      aria-busy="true"
    >
      <div className="page-loader-content" role="status" aria-live="polite">
        <div className="health-loader-art" aria-hidden="true">
          <span className="health-loader-halo" />
          <span className="health-loader-orbit" />
          <span className="health-loader-heart">
            <Heartbeat size={38} weight="duotone" />
          </span>
        </div>
        <Heading className={visualOnly ? 'sr-only' : undefined}>
          {t(label)}
          <span className="loader-ellipsis" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </Heading>
        {!visualOnly && description && <p>{t(description)}</p>}
        {!visualOnly && !embedded && (
          <span className="health-loader-track" aria-hidden="true">
            <span />
          </span>
        )}
      </div>
      {allowBack && (
        <a href="#/inquiries" className="loader-back">
          {t('Back to requests')}
        </a>
      )}
    </div>
  )
}
