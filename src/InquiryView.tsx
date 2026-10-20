import { IdentificationCard, Info, ShieldCheck, User, Users } from '@phosphor-icons/react'
import type { Inquiry } from './health'
import { ageOf, coverageOptions, relationshipLabels, tpaNetworks } from './health'
import { applicantRows, coverRows, tpaRows } from './Summary'
import { Avatar, Modal } from './ui'
import { useLanguage } from './language-context'
import { RequestProgress } from './RequestProgress'

export function InquiryView({ record, onClose }: { record?: Inquiry; onClose: () => void }) {
  const { t, locale } = useLanguage()
  const draft = record?.draft
  const showQuoteNote = ![751820009, 751820016].includes(Number(record?.dataverseStatus))
  const network = tpaNetworks.find((item) => item.value === draft?.tpaNetwork)
  const networkAdjustment =
    record?.customerData?.premium.networkAdjustmentPercent ?? network?.adjustment
  const adjustmentLabel =
    networkAdjustment === undefined
      ? ''
      : new Intl.NumberFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
          style: 'percent',
          maximumFractionDigits: 0,
          signDisplay: 'exceptZero',
        }).format(networkAdjustment / 100)
  const money = (amount: number | null | undefined) =>
    amount == null
      ? '\u2014'
      : new Intl.NumberFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
          style: 'currency',
          currency: 'AED',
          currencyDisplay: 'code',
        }).format(amount)
  const fields = (rows: [string, string][]) => (
    <dl className="request-summary-fields">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{t(label)}</dt>
          <dd dir={label === 'Email' || label === 'Mobile' ? 'ltr' : undefined}>
            {value ? t(value) : '\u2014'}
          </dd>
        </div>
      ))}
    </dl>
  )
  const age = draft ? ageOf(draft.applicant.dateOfBirth) : null
  const personCount = draft
    ? (draft.coverageTarget === 'dependents_only' ? 0 : 1) + draft.members.length
    : 0
  return (
    <Modal
      title="Request summary"
      open={Boolean(record)}
      onClose={onClose}
      className="personal-summary-modal request-summary-dialog"
    >
      {record &&
        draft &&
        (record.unreadable ? (
          <p role="alert">
            {t('The saved request JSON could not be read. Please contact support.')}
          </p>
        ) : (
          <div className="request-summary-body">
            <div className="request-summary-cover">
              <div className="request-summary-overview">
                <span className="request-summary-emblem">
                  <ShieldCheck size={27} weight="duotone" />
                </span>
                <div className="request-summary-cover-copy">
                  <small>{t('Health insurance')}</small>
                  <strong>
                    {t(
                      coverageOptions.find((option) => option.value === draft.coverageTarget)!
                        .label,
                    )}
                  </strong>
                  <span className="request-summary-count">
                    <Users size={14} />
                    {personCount} {t(personCount === 1 ? 'person covered' : 'people covered')}
                  </span>
                </div>
              </div>
              <div className="request-summary-prices">
                <div className="request-summary-network">
                  <span>{t('Network adjustment')}</span>
                  <strong>{adjustmentLabel || '\u2014'}</strong>
                </div>
                <div className="request-summary-gross">
                  <span>{t('Gross premium')}</span>
                  <strong>
                    {money(record.grossPremium ?? record.customerData?.premium.grossPremium)}
                  </strong>
                </div>
                <div className="request-summary-charge">
                  <span>{t('Premium to be charged')}</span>
                  <strong>
                    {money(
                      record.totalAmountCharge ?? record.customerData?.premium.totalAmountCharge,
                    )}
                  </strong>
                </div>
                {showQuoteNote && (
                  <p className="request-summary-disclaimer">
                    <Info size={15} aria-hidden="true" />
                    <span>
                      {t(
                        'The final quote will be dependent on DOH checks and KYC for each member.',
                      )}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <RequestProgress status={record.dataverseStatus} />
            <div className="request-summary-sections">
              <section className="request-summary-section">
                <h3>
                  <IdentificationCard size={17} />
                  {t('Cover details')}
                </h3>
                {fields([
                  ...coverRows(draft, locale),
                  ...tpaRows(draft),
                  ['Network adjustment', adjustmentLabel],
                  [
                    'Plan adjustment amount',
                    money(record.customerData?.premium.networkAdjustmentAmount),
                  ],
                ])}
              </section>
              <section className="request-summary-section">
                <h3>
                  <User size={17} />
                  {t(
                    draft.coverageTarget === 'dependents_only'
                      ? 'Sponsor details'
                      : 'Applicant details',
                  )}
                </h3>
                {fields([
                  ...applicantRows(draft, locale).filter(([label]) =>
                    ['Full name', 'Salary', 'Email', 'Mobile'].includes(label),
                  ),
                  ['Age', age === null ? '' : age + ' ' + t('years')],
                ])}
              </section>
            </div>
            {draft.members.length > 0 && (
              <section className="request-summary-family">
                <h3>
                  <Users size={17} />
                  {t('People in your cover')}
                </h3>
                <div className="request-summary-members">
                  {draft.members.map((member) => {
                    const memberAge = ageOf(member.dateOfBirth)
                    return (
                      <div className="request-summary-person" key={member.id}>
                        <Avatar person={member} relationship={member.relationship} size="small" />
                        <div>
                          <strong>{member.fullName}</strong>
                          <span>
                            {t(relationshipLabels[member.relationship])}
                            {memberAge === null ? '' : ' · ' + memberAge + ' ' + t('years')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        ))}
    </Modal>
  )
}
