import { useEffect, useRef, useState } from 'react'
import { CaretDown, PencilSimple, ShieldCheck } from '@phosphor-icons/react'
import {
  ageOf,
  art,
  countryName,
  coverageOptions,
  displayDate,
  formatMobile,
  isApplicantComplete,
  isMemberComplete,
  maskedEmail,
  relationshipLabels,
  statusOptions,
  visaOptions,
} from './health'
import type { Draft, Stage } from './health'
import { useLanguage } from './language-context'
import { Avatar, Hint, Status } from './ui'

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

export function Summary({
  draft,
  activeMemberId,
  onEdit,
  onEditMember,
  onChangeCoverage,
}: {
  draft: Draft
  activeMemberId: string | null
  onEdit: (stage: Stage, group?: number) => void
  onEditMember: (id: string) => void
  onChangeCoverage: () => void
}) {
  const { t, locale } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const [canStick, setCanStick] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const update = () => {
      if (detailsRef.current) detailsRef.current.open = media.matches
    }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    const update = () =>
      setCanStick((panelRef.current?.offsetHeight ?? Infinity) < window.innerHeight - 112)
    const observer = new ResizeObserver(update)
    if (panelRef.current) observer.observe(panelRef.current)
    window.addEventListener('resize', update)
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])
  const included = draft.coverageTarget !== 'dependents_only'
  const applicantComplete = isApplicantComplete(draft)
  const members = draft.coverageTarget === 'self' ? [] : draft.members
  const total = members.length + Number(included)
  const complete = members.filter(isMemberComplete).length + Number(included && applicantComplete)
  const option = coverageOptions.find((o) => o.value === draft.coverageTarget)!
  const age = ageOf(draft.applicant.dateOfBirth)
  return (
    <aside className={`inquiry-sidebar ${canStick ? 'can-stick' : ''}`}>
      <details ref={detailsRef} className="summary-shell">
        <summary className="mobile-summary-trigger">
          <ShieldCheck size={21} />
          <span>{t('Your cover so far')}</span>
          <span className="summary-mini-count">
            {complete}/{total}
          </span>
          <CaretDown />
        </summary>
        <div className="cover-summary" ref={panelRef}>
          <div className="summary-title">
            <h2>{t('Your health cover')}</h2>
            <span className="summary-private">
              <ShieldCheck size={18} />
            </span>
          </div>
          <div className="coverage-overview">
            <div className="overview-main">
              <img src={art.shield} alt="" width="1254" height="1254" />
              <div>
                <strong>{t(option.label)}</strong>
                <p>
                  {t(
                    included
                      ? 'You are included in this inquiry'
                      : 'You are the sponsor and are not included',
                  )}
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={onChangeCoverage}
                aria-label={t('Change who needs cover')}
              >
                <PencilSimple size={17} />
              </button>
            </div>
            <div className="people-completion">
              <span>
                {total
                  ? `${complete} ${t('of')} ${total} ${t('people complete')}`
                  : t('No family members added yet.')}
              </span>
              <progress
                aria-label={
                  locale === 'ar' ? 'اكتمال بيانات الأفراد' : 'People with complete details'
                }
                value={complete}
                max={total || 1}
              />
            </div>
          </div>
          <section className="summary-section">
            <div className="section-title">
              <h3>{t('Cover details')}</h3>
              <button onClick={() => onEdit('cover', 0)} className="edit-button">
                <PencilSimple />
                {t('Edit')}
              </button>
            </div>
            <DataRows rows={coverRows(draft, locale)} />
          </section>
          <section className="summary-section">
            <div className="section-title">
              <h3>{t(included ? 'Your details' : 'Sponsor details')}</h3>
              <button onClick={() => onEdit('details', 0)} className="edit-button">
                <PencilSimple />
                {t('Edit')}
              </button>
            </div>
            {draft.applicant.fullName || draft.applicant.dateOfBirth || draft.applicant.gender ? (
              <>
                <div className="summary-person-heading">
                  <Avatar person={draft.applicant} />
                  <div>
                    <strong>{draft.applicant.fullName || t(included ? 'You' : 'Sponsor')}</strong>
                    <span>{age !== null ? `${age} ${t('years old')}` : t('Not added yet')}</span>
                  </div>
                  <Status complete={applicantComplete} />
                </div>
                <DataRows
                  rows={
                    expanded
                      ? applicantRows(draft, locale).slice(1)
                      : [
                          ['Marital status', draft.applicant.maritalStatus],
                          ['Salary', salaryLabel(draft.applicant.salaryBand)],
                          ['Email', maskedEmail(draft.applicant.email)],
                          ['Mobile', formatMobile(draft.applicant.mobile, true)],
                        ]
                  }
                />
                <button
                  className="expand-link"
                  aria-expanded={expanded}
                  onClick={() => setExpanded((value) => !value)}
                >
                  {t(expanded ? 'Show less' : 'Show all details')}
                  <CaretDown className={expanded ? 'rotate' : ''} />
                </button>
              </>
            ) : (
              <p className="summary-empty">{t('Your details will appear here as you go.')}</p>
            )}
          </section>
          {draft.coverageTarget !== 'self' && (
            <section className="summary-section">
              <div className="section-title">
                <h3>{t('People in your inquiry')}</h3>
              </div>
              {included && (
                <button className="summary-person-row" onClick={() => onEdit('details', 0)}>
                  <Avatar person={draft.applicant} size="small" />
                  <span>
                    <strong>{draft.applicant.fullName || t('You')}</strong>
                    <small>
                      {t('You')}
                      {age !== null && ` · ${age}`}
                    </small>
                  </span>
                  <Status complete={applicantComplete} />
                </button>
              )}
              {members.map((member) => (
                <button
                  key={member.id}
                  className={`summary-person-row ${activeMemberId === member.id ? 'active' : ''}`}
                  onClick={() => onEditMember(member.id)}
                >
                  <Avatar person={member} relationship={member.relationship} size="small" />
                  <span>
                    <strong>{member.fullName || t(relationshipLabels[member.relationship])}</strong>
                    <small>
                      {t(relationshipLabels[member.relationship])}
                      {ageOf(member.dateOfBirth) !== null && ` · ${ageOf(member.dateOfBirth)}`}
                    </small>
                  </span>
                  <Status
                    complete={isMemberComplete(member)}
                    editing={activeMemberId === member.id}
                  />
                </button>
              ))}
              {!members.length && (
                <p className="summary-empty">{t('No family members added yet.')}</p>
              )}
            </section>
          )}
          <div className="summary-foot">
            <Hint>{t('Your information, all in one place.')}</Hint>
          </div>
        </div>
      </details>
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
            <button className="edit-button" onClick={() => onEdit('cover', 0)}>
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
            <button className="edit-button" onClick={() => onEdit('details', 0)}>
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
                <button className="edit-button" onClick={() => onEditMember(member.id)}>
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
