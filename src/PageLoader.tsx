import { Heartbeat } from '@phosphor-icons/react'
import { useLanguage } from './language-context'

/** Shared screen loader; mount only while a page transition or request is pending. */
export function PageLoader({
  label = 'Opening your inquiry',
  description = 'Your cover details, coming together.',
}: {
  label?: string
  description?: string
}) {
  const { t } = useLanguage()
  return (
    <div className="page-loader" id="main-content" aria-busy="true">
      <div className="page-loader-content" role="status" aria-live="polite">
        <div className="health-loader-art" aria-hidden="true">
          <span className="health-loader-halo" />
          <span className="health-loader-orbit" />
          <span className="health-loader-heart">
            <Heartbeat size={38} weight="duotone" />
          </span>
        </div>
        <h1>
          {t(label)}
          <span className="loader-ellipsis" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </h1>
        <p>{t(description)}</p>
        <span className="health-loader-track" aria-hidden="true">
          <span />
        </span>
      </div>
      <a href="#/inquiries" className="loader-back">
        {t('Back to inquiries')}
      </a>
    </div>
  )
}
