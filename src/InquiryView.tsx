import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  Check,
  Copy,
  EnvelopeSimple,
  FileText,
  Info,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Users,
} from '@phosphor-icons/react'
import type { Inquiry, Person, Relationship } from './health'
import { countryName, coverageOptions, formatMobile, relationshipLabels } from './health'
import { useLanguage } from './language-context'
import { applicantRows, coverRows, DataRows } from './Summary'
import { Avatar } from './ui'
import { inquiryStatus, insuredCount, recordDate } from './inquiryData'
import { PageLoader } from './PageLoader'
import { PremiumBreakdown } from './PremiumBreakdown'
import { FamilyTree } from './FamilyTree'
import { InquiryDocuments } from './InquiryDocuments'

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description?: string
  icon: ReactNode
  children: ReactNode
}) {
  const { t } = useLanguage()
  return (
    <section className="inquiry-detail-section">
      <div className="detail-section-heading">
        <span>{icon}</span>
        <div>
          <h2>{t(title)}</h2>
          {description && <p>{t(description)}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export function InquiryView({
  record,
  skipLoader = false,
}: {
  record?: Inquiry
  skipLoader?: boolean
}) {
  const { t, locale } = useLanguage()
  const [loading, setLoading] = useState(!skipLoader)
  const [tab, setTab] = useState('details')
  const [copyState, setCopyState] = useState('')
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650)
    return () => {
      clearTimeout(timer)
      if (copyTimer.current) clearTimeout(copyTimer.current)
    }
  }, [])
  useEffect(() => {
    if (!loading) document.getElementById('inquiry-view-heading')?.focus({ preventScroll: true })
  }, [loading])
  if (!record)
    return (
      <main id="main-content" className="detail-not-found">
        <FileText size={42} weight="duotone" />
        <h1>{t('Inquiry not found')}</h1>
        <p>{t('This inquiry is no longer available in this session.')}</p>
        <a href="#/inquiries" className="button primary">
          {t('Back to inquiries')}
          <ArrowRight size={16} className="directional" />
        </a>
      </main>
    )
  if (loading) return <PageLoader />
  const draft = record.draft
  const sponsor = draft.coverageTarget === 'dependents_only'
  const coverage = coverageOptions.find((option) => option.value === draft.coverageTarget)!
  const people: (Person & { id: string; relationship?: Relationship; label: string })[] = [
    ...(!sponsor ? [{ ...draft.applicant, id: 'applicant', label: 'You' }] : []),
    ...draft.members.map((member) => ({
      ...member,
      label: relationshipLabels[member.relationship],
    })),
  ]
  const tabs = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'people', label: 'People in cover', icon: Users },
  ]
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(record.id)
      setCopyState('Reference copied')
    } catch {
      setCopyState('Unable to copy. Select the reference to copy it.')
    }
    if (copyTimer.current) clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopyState(''), 3000)
  }
  return (
    <main id="main-content" className="inquiry-detail-page">
      <nav className="detail-breadcrumb" aria-label={t('Breadcrumb')}>
        <a href="#/inquiries">{t('My Inquiries')}</a>
        <span>/</span>
        <span>{record.id}</span>
      </nav>
      <div className="detail-topline">
        <a href="#/inquiries" className="detail-back">
          <ArrowLeft size={17} className="directional" />
          {t('Back to inquiries')}
        </a>
        <span>
          <span className="detail-readonly">
            <ShieldCheck size={14} />
            {t('View only')}
          </span>
          {record.sample && <span className="sample-label">{t('Sample inquiry')}</span>}
        </span>
      </div>
      <header className="detail-hero detail-hero-with-premium">
        <div className="detail-identity-panel">
          <div className="detail-identity">
            <span className="detail-shield">
              <ShieldCheck size={32} weight="duotone" />
            </span>
            <div>
              <div className="detail-reference">
                <span>{record.id}</span>
                <button type="button" onClick={copy} aria-label={t('Copy inquiry reference')}>
                  {copyState === 'Reference copied' ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
              <h1 id="inquiry-view-heading" tabIndex={-1}>
                {t('Inquiry for Health Insurance')} - <bdi>{draft.applicant.email}</bdi>
              </h1>
              <p>
                {t(coverage.label)}
                <span aria-hidden="true"> / </span>
                {draft.applicant.fullName}
              </p>
            </div>
          </div>
          <div className="detail-hero-meta">
            <span className={`record-status ${record.status ?? 'prepared'}`}>
              <span />
              {t(inquiryStatus(record))}
            </span>
            <span>
              <CalendarBlank size={14} />
              {t('Created')} {recordDate(record.createdAt, locale)}
            </span>
          </div>
        </div>
        <PremiumBreakdown record={record} />
      </header>
      <p className="sr-only" role="status">
        {t(copyState)}
      </p>
      {record.sample && (
        <div className="detail-sample-banner">
          <Info size={17} />
          <span>
            {t(
              'Sample inquiry with fictional details. No policy or application has been submitted.',
            )}
          </span>
        </div>
      )}
      <div className="inquiry-detail-layout">
        <div className="detail-main">
          <div className="detail-tabs" role="tablist" aria-label={t('Inquiry sections')}>
            {tabs.map(({ id, label, icon: Icon }, index) => (
              <button
                type="button"
                key={id}
                role="tab"
                id={`detail-tab-${id}`}
                aria-controls={`detail-panel-${id}`}
                aria-selected={tab === id}
                tabIndex={tab === id ? 0 : -1}
                onClick={() => setTab(id)}
                onKeyDown={(event) => {
                  const shift =
                    event.key === 'ArrowRight'
                      ? locale === 'ar'
                        ? -1
                        : 1
                      : event.key === 'ArrowLeft'
                        ? locale === 'ar'
                          ? 1
                          : -1
                        : 0
                  if (shift || event.key === 'Home' || event.key === 'End') {
                    event.preventDefault()
                    const next =
                      event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? tabs.length - 1
                          : (index + shift + tabs.length) % tabs.length
                    setTab(tabs[next].id)
                    document.getElementById(`detail-tab-${tabs[next].id}`)?.focus()
                  }
                }}
              >
                <Icon size={17} />
                {t(label)}
                {id === 'people' && <span>{people.length}</span>}
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id={`detail-panel-${tab}`}
            aria-labelledby={`detail-tab-${tab}`}
            className="detail-tab-panel"
            tabIndex={0}
            key={tab}
          >
            {tab === 'details' && (
              <>
                <Section
                  title="Cover details"
                  description="The cover requested in this inquiry."
                  icon={<ShieldCheck size={21} />}
                >
                  <DataRows rows={[[t('Cover'), t(coverage.label)], ...coverRows(draft, locale)]} />
                </Section>
                <Section
                  title="Applicant information"
                  description={
                    sponsor
                      ? 'The sponsor is not included in this cover.'
                      : 'The applicant is included in this cover.'
                  }
                  icon={<User size={21} />}
                >
                  <div className="detail-applicant-heading">
                    <Avatar person={draft.applicant} />
                    <div>
                      <strong>{draft.applicant.fullName}</strong>
                      <span>{t(sponsor ? 'Sponsor' : 'Primary applicant')}</span>
                    </div>
                  </div>
                  <DataRows
                    rows={[
                      ...applicantRows(draft, locale),
                      ['Nationality', countryName(draft.nationalityCode, locale)],
                    ]}
                  />
                </Section>
                <InquiryDocuments record={record} />
              </>
            )}
            {tab === 'people' && (
              <Section
                title="People in cover"
                description="Everyone included, grouped by their relationship to the applicant."
                icon={<Users size={21} />}
              >
                <FamilyTree draft={draft} />
              </Section>
            )}
          </div>
        </div>
        <aside className="detail-aside" aria-label={t('Inquiry summary')}>
          <section className="detail-cover-card">
            <div className="detail-cover-card-heading">
              <ShieldCheck size={24} weight="duotone" />
              <span>{t('Your health cover')}</span>
            </div>
            <h2>{t(coverage.label)}</h2>
            <p>
              {t(
                sponsor
                  ? 'Your dependents are included. You are the sponsor.'
                  : 'Cover for you and the people in this inquiry.',
              )}
            </p>
            <div className="detail-cover-count">
              <strong>{insuredCount(record)}</strong>
              <span>{t('people in cover')}</span>
              <div className="detail-avatar-stack">
                {people.slice(0, 4).map((item) => (
                  <Avatar
                    key={item.id}
                    person={item}
                    relationship={item.relationship}
                    size="small"
                  />
                ))}
              </div>
            </div>
            <div className="detail-cover-location">
              <MapPin size={16} />
              {t(draft.visaEmirate)}
              <span>
                {draft.visaEmirate === 'Abu Dhabi'
                  ? t('DoH rules')
                  : draft.visaEmirate === 'Dubai'
                    ? t('DHA rules')
                    : t('MoH rules')}
              </span>
            </div>
          </section>
          <section className="detail-contact-card">
            <h2>{t('Contact details')}</h2>
            <p>{t(sponsor ? 'Sponsor' : 'Primary applicant')}</p>
            <a href={`mailto:${draft.applicant.email}`}>
              <span>
                <EnvelopeSimple size={18} />
              </span>
              <span>
                <small>{t('Email')}</small>
                <strong dir="ltr">{draft.applicant.email}</strong>
              </span>
            </a>
            <a href={`tel:+971${draft.applicant.mobile}`}>
              <span>
                <Phone size={18} />
              </span>
              <span>
                <small>{t('Mobile')}</small>
                <strong dir="ltr">{formatMobile(draft.applicant.mobile)}</strong>
              </span>
            </a>
          </section>
          <div className="detail-side-note">
            <Info size={17} />
            <p>
              {t(
                record.sample
                  ? 'Sample details and premium amounts are for demonstration only.'
                  : 'This is a local inquiry preview. No policy has been issued.',
              )}
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
