import {
  ArrowsClockwise,
  ArrowRight,
  ClipboardText,
  IdentificationCard,
  Plus,
  ShieldCheck,
  Users,
} from '@phosphor-icons/react'
import type { Inquiry } from './health'
import { coverageOptions } from './health'
import { useLanguage } from './language-context'
import { insuredCount } from './inquiryData'
import { PageLoader } from './PageLoader'
import { FOLLOW_UP_STATUS } from './powerPagesApi'
import { isKycSubmission } from './kycQuestions'

export function InquiryList({
  records,
  onOpen,
  loading = false,
  error = '',
  onRetry,
  onAction,
}: {
  records: Inquiry[]
  onOpen: (id: string) => void
  loading?: boolean
  error?: string
  onRetry?: () => void
  onAction: (kind: 'identity' | 'kyc', id: string) => void
}) {
  const { t } = useLanguage()
  const visibleRecords = records
  return (
    <main className="personal-inquiries" id="main-content">
      <div className="personal-inquiries-heading">
        <div>
          <h1>{t('My Requests')}</h1>
          <p>{t('Your cover, all in one place.')}</p>
        </div>
        <div className="personal-request-tools">
          <button
            type="button"
            className="button secondary"
            onClick={onRetry}
            disabled={loading}
            aria-label={t('Refresh requests')}
          >
            <ArrowsClockwise size={16} />
            {t('Refresh')}
          </button>
          <a className="button secondary" href="#/">
            <Plus size={16} />
            {t('New request')}
          </a>
        </div>
      </div>
      {error && (
        <div className="requests-load-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={onRetry}>
            {t('Retry')}
          </button>
        </div>
      )}
      {loading ? (
        <PageLoader label="Loading requests" description="" embedded allowBack={false} />
      ) : (
        <div className="personal-inquiry-cards">
          {visibleRecords.map((record) => (
            <article key={record.id} className="personal-inquiry-card">
              <button
                type="button"
                className="request-card-open"
                onClick={() => onOpen(record.id)}
                aria-haspopup="dialog"
              >
                <div className="personal-plan-top">
                  <span className="personal-plan-icon">
                    <ShieldCheck size={25} weight="duotone" />
                  </span>
                  <ArrowRight size={18} className="directional" />
                </div>
                <p className="personal-product">{t('Health insurance')}</p>
                <h2>
                  {record.unreadable
                    ? record.name || t('Saved details unavailable')
                    : t(
                        coverageOptions.find(
                          (option) => option.value === record.draft.coverageTarget,
                        )!.label,
                      )}
                </h2>
                {!record.unreadable && (
                  <>
                    <div className="personal-plan-members">
                      <Users size={16} />
                      <span>
                        {insuredCount(record)}{' '}
                        {t(insuredCount(record) === 1 ? 'person covered' : 'people covered')}
                      </span>
                    </div>
                    <div className="personal-covered-names">
                      {[
                        ...(record.draft.coverageTarget === 'dependents_only'
                          ? []
                          : [record.draft.applicant.fullName]),
                        ...record.draft.members.map((member) => member.fullName),
                      ].join(', ')}
                    </div>
                  </>
                )}
                <div className="personal-card-footer">
                  <span>
                    {t(
                      record.unreadable
                        ? 'Saved details unavailable'
                        : record.dataverseStatus === FOLLOW_UP_STATUS.emiratesIdRequired
                          ? 'Emirates ID required'
                          : record.dataverseStatus === FOLLOW_UP_STATUS.kycRequired
                            ? 'KYC information required'
                            : record.dataverseStatus === FOLLOW_UP_STATUS.ipcVerification
                              ? 'Verification in progress'
                              : isKycSubmission(record.customerData?.kyc)
                                ? 'Information submitted'
                                : 'Request created',
                    )}
                  </span>
                  <span>{t('View summary')}</span>
                </div>
              </button>
              {(record.dataverseStatus === FOLLOW_UP_STATUS.emiratesIdRequired ||
                record.dataverseStatus === FOLLOW_UP_STATUS.kycRequired ||
                isKycSubmission(record.customerData?.kyc)) && (
                <div className="request-card-actions">
                  {record.dataverseStatus === FOLLOW_UP_STATUS.emiratesIdRequired && (
                    <button
                      type="button"
                      className="request-action-button"
                      aria-haspopup="dialog"
                      onClick={() => onAction('identity', record.id)}
                    >
                      <IdentificationCard size={18} />
                      {t('Upload Emirates ID')}
                      <ArrowRight className="directional" size={16} />
                    </button>
                  )}
                  {(record.dataverseStatus === FOLLOW_UP_STATUS.kycRequired ||
                    isKycSubmission(record.customerData?.kyc)) && (
                    <button
                      type="button"
                      className="request-action-button"
                      aria-haspopup="dialog"
                      onClick={() => onAction('kyc', record.id)}
                    >
                      <ClipboardText size={18} />
                      {t(
                        isKycSubmission(record.customerData?.kyc)
                          ? 'View KYC information'
                          : 'Complete KYC information',
                      )}
                      <ArrowRight className="directional" size={16} />
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {!loading && !error && !visibleRecords.length && (
        <div className="personal-inquiries-empty">
          <ShieldCheck size={34} />
          <h2>{t('No inquiries yet')}</h2>
          <a className="text-link" href="#/">
            {t('Start an inquiry')}
          </a>
        </div>
      )}
    </main>
  )
}
