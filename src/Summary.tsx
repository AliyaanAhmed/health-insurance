import {
  Check,
  PencilSimple,
  ShieldCheck,
  Globe,
  MapPin,
  IdentificationCard,
  User,
  Users,
  Cake,
  CurrencyCircleDollar,
} from '@phosphor-icons/react'
import {
  ageOf,
  countryName,
  coverageOptions,
  displayDate,
  formatMobile,
  relationshipLabels,
  statusOptions,
  visaOptions,
  tpaNetworks,
} from './health'
import type { Draft, Stage } from './health'
import { useLanguage } from './language-context'
import { Avatar } from './ui'
import { PremiumRange } from './PremiumRange'

function salaryLabel(band: string) {
  return band === 'above_4000'
    ? 'Above AED 4,000'
    : band === 'below_4000'
      ? 'Below AED 4,000'
      : band === 'pending_4000'
        ? 'Salary band to be confirmed'
        : ''
}
export function DataRows({ rows }: { rows: [string, string][] }) {
  const { t } = useLanguage()
  return (
    <dl className="data-rows">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{t(label)}</dt>
          <dd dir={label === 'Email' || label === 'Mobile' ? 'ltr' : undefined}>
            {value ? t(value) : <span className="unknown">{t('Not added yet')}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}
export function coverRows(draft: Draft, locale: string): [string, string][] {
  return [
    ['Visa type', visaOptions.find((o) => o.value === draft.visaType)?.label ?? ''],
    ['Nationality', countryName(draft.nationalityCode, locale)],
    ['Visa emirate', draft.visaEmirate],
    ['Visa status', statusOptions.find((o) => o.value === draft.visaStatus)?.label ?? ''],
  ]
}
export function applicantRows(draft: Draft, locale: string): [string, string][] {
  const a = draft.applicant
  return [
    ['Full name', a.fullName.trim()],
    ['Date of birth', displayDate(a.dateOfBirth, locale)],
    ['Gender', a.gender ? (a.gender === 'male' ? 'Male' : 'Female') : ''],
    ['Marital status', a.maritalStatus],
    ['Salary', salaryLabel(a.salaryBand)],
    ['Email', a.email.trim()],
    ['Mobile', formatMobile(a.mobile)],
  ]
}
export function tpaRows(draft: Draft): [string, string][] {
  return [
    ['Plan name', draft.tpa],
    ['Network', tpaNetworks.find((network) => network.value === draft.tpaNetwork)?.label ?? ''],
  ]
}

export function memberSummary(draft: Draft, t: (text: string) => string) {
  const groups = [
    { key: 'spouse', one: 'spouse', many: 'spouses' },
    { key: 'child', one: 'child', many: 'children' },
    { key: 'parent', one: 'parent', many: 'parents' },
    { key: 'other', one: 'dependant', many: 'dependants' },
  ]
  return groups
    .flatMap((group) => {
      const count = draft.members.filter((member) => member.relationship === group.key).length
      return count ? [count + ' ' + t(count === 1 ? group.one : group.many)] : []
    })
    .join(', ')
}
export function InquirySummaryCard({
  draft,
  onEdit,
  onChangeCoverage,
  showPeople = false,
}: {
  draft: Draft
  onEdit?: (stage: Stage, group?: number) => void
  onChangeCoverage?: () => void
  showPeople?: boolean
}) {
  const { t, locale } = useLanguage()
  const option = coverageOptions.find((item) => item.value === draft.coverageTarget)!
  const age = ageOf(draft.applicant.dateOfBirth)
  const rows: { label: string; value: string; stage: Stage; group: number }[] = [
    {
      label: 'Nationality',
      value: countryName(draft.nationalityCode, locale),
      stage: 'cover',
      group: 1,
    },
    { label: 'Visa emirate', value: draft.visaEmirate, stage: 'cover', group: 2 },
    {
      label: 'Visa status',
      value: statusOptions.find((item) => item.value === draft.visaStatus)?.label ?? '',
      stage: 'cover',
      group: 3,
    },
    { label: 'Name', value: draft.applicant.fullName.trim(), stage: 'details', group: 2 },
    { label: 'Age', value: age === null ? '' : age + ' ' + t('years'), stage: 'details', group: 1 },
    { label: 'Salary', value: salaryLabel(draft.applicant.salaryBand), stage: 'details', group: 1 },
    {
      label: 'Plans',
      value: tpaNetworks.find((network) => network.value === draft.tpaNetwork)?.label ?? '',
      stage: 'tpa',
      group: 0,
    },
    ...(draft.coverageTarget === 'self'
      ? []
      : [{ label: 'Members', value: memberSummary(draft, t), stage: 'family' as Stage, group: 0 }]),
  ]
  const rowIcons = {
    Nationality: Globe,
    'Visa emirate': MapPin,
    'Visa status': IdentificationCard,
    Name: User,
    Age: Cake,
    Salary: CurrencyCircleDollar,
    Members: Users,
    Plans: IdentificationCard,
  }
  const CoverIcon = draft.coverageTarget === 'self' ? User : Users
  return (
    <section
      className={`minimal-cover-card ${onEdit ? 'quote-live-card' : ''}`}
      aria-label={t(onEdit ? 'Your quote so far' : 'Your health cover')}
    >
      {onEdit && (
        <div className="quote-panel-heading">
          <h2>{t('Your quote so far')}</h2>
          <span className="quote-live-dot" aria-hidden="true" />
        </div>
      )}
      <div className="minimal-cover-title">
        {onEdit && (
          <span className="quote-cover-icon" aria-hidden="true">
            <CoverIcon size={23} />
          </span>
        )}
        <span>
          <small>{t('Cover for')}</small>
          <strong>{t(option.label)}</strong>
        </span>
        {onChangeCoverage ? (
          <button
            type="button"
            className="summary-change"
            onClick={onChangeCoverage}
            aria-label={t('Change who needs cover')}
          >
            <PencilSimple size={17} />
          </button>
        ) : (
          <ShieldCheck size={21} />
        )}
      </div>
      {onEdit && <PremiumRange />}
      <dl className="minimal-cover-values">
        {rows.map((row) => (
          <div key={row.label} className={onEdit ? 'quote-answer-row' : ''}>
            <dt>
              {onEdit &&
                (() => {
                  const Icon = rowIcons[row.label as keyof typeof rowIcons]
                  return <Icon size={14} aria-hidden="true" />
                })()}
              {t(row.label)}
            </dt>
            <dd>
              {onEdit && row.value ? (
                <button
                  type="button"
                  onClick={() => onEdit(row.stage, row.group)}
                  aria-label={t('Edit') + ' ' + t(row.label)}
                >
                  <span key={row.value} className="quote-answer-value">
                    {t(row.value)}
                  </span>
                  <span className="quote-answer-action" aria-hidden="true">
                    <Check size={13} weight="bold" className="quote-answer-check" />
                    <PencilSimple size={13} className="quote-answer-pencil" />
                  </span>
                </button>
              ) : (
                <span>{row.value ? t(row.value) : '—'}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {onEdit && (
        <div className="quote-panel-footer">
          <span>
            <PencilSimple size={12} />
            {t('Tap an answer to edit')}
          </span>
        </div>
      )}
      {showPeople && draft.members.length > 0 && (
        <div className="minimal-member-names">
          {draft.members.map((member) => (
            <div key={member.id}>
              <Avatar person={member} relationship={member.relationship} size="small" />
              <span>
                <strong>{member.fullName}</strong>
                <small>
                  {t(relationshipLabels[member.relationship])}
                  {ageOf(member.dateOfBirth) !== null &&
                    ' / ' + ageOf(member.dateOfBirth) + ' ' + t('years')}
                </small>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
export function Summary({
  draft,
  onEdit,
  onChangeCoverage,
}: {
  draft: Draft
  onEdit: (stage: Stage, group?: number) => void
  onChangeCoverage: () => void
}) {
  return (
    <aside className="inquiry-sidebar minimal-summary-sidebar">
      <InquirySummaryCard draft={draft} onEdit={onEdit} onChangeCoverage={onChangeCoverage} />
    </aside>
  )
}

export function ReviewContent({
  draft,
  onEdit,
  onEditMember,
}: {
  draft: Draft
  onEdit?: (stage: Stage, group?: number) => void
  onEditMember?: (id: string) => void
}) {
  const { t, locale } = useLanguage()
  return (
    <div className="review-content">
      <section className="review-section">
        <div className="section-title">
          <h3>{t('Cover details')}</h3>
          {onEdit && (
            <button type="button" className="edit-button" onClick={() => onEdit('cover', 0)}>
              <PencilSimple />
              {t('Edit')}
            </button>
          )}
        </div>
        <DataRows
          rows={[
            [t('Cover'), coverageOptions.find((o) => o.value === draft.coverageTarget)!.label],
            ...coverRows(draft, locale),
          ]}
        />
      </section>
      <section className="review-section">
        <div className="section-title">
          <h3>
            {t(draft.coverageTarget === 'dependents_only' ? 'Sponsor details' : 'Your details')}
          </h3>
          {onEdit && (
            <button type="button" className="edit-button" onClick={() => onEdit('details', 0)}>
              <PencilSimple />
              {t('Edit')}
            </button>
          )}
        </div>
        <DataRows rows={applicantRows(draft, locale)} />
        <span
          className={`inclusion-note ${draft.coverageTarget === 'dependents_only' ? 'excluded' : ''}`}
        >
          <ShieldCheck size={16} />
          {t(
            draft.coverageTarget === 'dependents_only'
              ? 'Not included in cover'
              : 'Included in cover',
          )}
        </span>
      </section>
      <section className="review-section">
        <div className="section-title">
          <h3>{t('Plans')}</h3>
          {onEdit && (
            <button type="button" className="edit-button" onClick={() => onEdit('tpa', 0)}>
              <PencilSimple />
              {t('Edit')}
            </button>
          )}
        </div>
        <DataRows rows={tpaRows(draft)} />
      </section>
      {draft.coverageTarget !== 'self' &&
        draft.members.map((member) => (
          <section className="review-section review-member" key={member.id}>
            <div className="section-title">
              <div className="review-member-title">
                <Avatar person={member} relationship={member.relationship} />
                <div>
                  <h3>{member.fullName}</h3>
                  <span>{t(relationshipLabels[member.relationship])}</span>
                </div>
              </div>
              {onEditMember && (
                <button
                  type="button"
                  className="edit-button"
                  onClick={() => onEditMember(member.id)}
                >
                  <PencilSimple />
                  {t('Edit')}
                </button>
              )}
            </div>
            <DataRows
              rows={[
                ['Date of birth', displayDate(member.dateOfBirth, locale)],
                ['Gender', member.gender === 'male' ? 'Male' : 'Female'],
              ]}
            />
          </section>
        ))}
    </div>
  )
}
