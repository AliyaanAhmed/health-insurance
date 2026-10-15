import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Clock,
  FunnelSimple,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  Users,
  X,
} from '@phosphor-icons/react'
import type { Inquiry, CoverageTarget } from './health'
import { coverageOptions } from './health'
import { useLanguage } from './language-context'
import { Avatar } from './ui'
import { inquiryStatus, insuredCount, recordDate, inquiryName } from './inquiryData'

type ListProps = { records: Inquiry[]; hasStarted: boolean; lastPath: string }
export function InquiryList({ records, hasStarted, lastPath }: ListProps) {
  const { t, locale } = useLanguage()
  const [query, setQuery] = useState('')
  const [coverage, setCoverage] = useState<CoverageTarget | ''>('')
  const [filter, setFilter] = useState('all')
  const [newest, setNewest] = useState(true)
  const filtered = useMemo(
    () =>
      records
        .filter((record) => {
          const match =
            `${record.id} ${record.draft.applicant.fullName} ${record.draft.applicant.email} ${record.draft.visaEmirate}`
              .toLowerCase()
              .includes(query.toLowerCase().trim())
          return (
            match &&
            (!coverage || record.draft.coverageTarget === coverage) &&
            (filter === 'all' || record.status === filter)
          )
        })
        .sort(
          (a, b) =>
            (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * (newest ? 1 : -1),
        ),
    [records, query, coverage, filter, newest],
  )
  const tabs = [
    { id: 'all', label: 'All inquiries' },
    { id: 'reviewing', label: 'In review' },
    { id: 'ready', label: 'Ready for review' },
  ]
  const reset = () => {
    setQuery('')
    setCoverage('')
    setFilter('all')
  }
  return (
    <main className="records-page" id="main-content">
      <div className="records-page-heading">
        <div>
          <p className="eyebrow">{t('Your health, organised')}</p>
          <h1>{t('My Inquiries')}</h1>
          <p>{t('A clear view of every inquiry, and everyone in it.')}</p>
        </div>
        <a href="#/" className="button primary">
          <Plus size={18} />
          {t('New inquiry')}
        </a>
      </div>
      <div className="record-stats">
        {[
          { icon: ShieldCheck, label: 'Total inquiries', value: records.length },
          {
            icon: Clock,
            label: 'In review',
            value: records.filter((r) => r.status === 'reviewing').length,
          },
          {
            icon: Users,
            label: 'People in cover',
            value: records.reduce((sum, record) => sum + insuredCount(record), 0),
          },
        ].map(({ icon: Icon, label, value }) => (
          <div className="record-stat" key={label}>
            <span className="record-stat-icon">
              <Icon size={22} weight="duotone" />
            </span>
            <div>
              <span>{t(label)}</span>
              <strong>{value.toLocaleString(locale)}</strong>
            </div>
          </div>
        ))}
      </div>
      {hasStarted && (
        <div className="record-resume">
          <span>
            <Clock size={19} />
            <strong>{t('You have an unfinished inquiry.')}</strong>
          </span>
          <a href={`#${lastPath}`}>
            {t('Resume')}
            <ArrowRight size={16} className="directional" />
          </a>
        </div>
      )}
      <section className="records-table-panel" aria-label={t('My Inquiries')}>
        <div className="records-tabs" role="group" aria-label={t('Filter by status')}>
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              aria-pressed={filter === tab.id}
              className={filter === tab.id ? 'active' : ''}
              onClick={() => setFilter(tab.id)}
            >
              {t(tab.label)}
              <span>{records.filter((r) => tab.id === 'all' || r.status === tab.id).length}</span>
            </button>
          ))}
        </div>
        <div className="records-toolbar">
          <div className="records-search">
            <MagnifyingGlass size={19} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Search by name, reference or emirate')}
              aria-label={t('Search inquiries')}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label={t('Clear search')}>
                <X size={15} />
              </button>
            )}
          </div>
          <label className="records-filter">
            <FunnelSimple size={16} />
            <span className="sr-only">{t('Cover type')}</span>
            <select
              value={coverage}
              onChange={(event) => setCoverage(event.target.value as CoverageTarget | '')}
            >
              <option value="">{t('All cover types')}</option>
              {coverageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="records-table-scroll"
          tabIndex={0}
          role="region"
          aria-label={t('Inquiry table')}
        >
          <table className="records-table">
            <caption className="sr-only">{t('Health insurance inquiries')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('Inquiry / Applicant')}</th>
                <th scope="col">{t('Cover')}</th>
                <th scope="col">{t('People')}</th>
                <th scope="col">{t('Status')}</th>
                <th scope="col" aria-sort={newest ? 'descending' : 'ascending'}>
                  <button
                    type="button"
                    className="record-sort"
                    onClick={() => setNewest(!newest)}
                    aria-label={t(newest ? 'Sort oldest first' : 'Sort newest first')}
                  >
                    {t('Created')}
                    {newest ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
                  </button>
                </th>
                <th scope="col">
                  <span className="sr-only">{t('View details')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="record-applicant">
                      <Avatar person={record.draft.applicant} />
                      <div>
                        <a className="record-name" href={`#/inquiries/${record.id}`}>
                          {inquiryName(record, t('Inquiry for Health Insurance'))}
                          <ArrowUpRight size={12} className="directional" />
                        </a>
                        <span className="record-reference-line">
                          {record.draft.applicant.fullName} / {record.id}
                          {record.sample && <span className="sample-label">{t('Sample')}</span>}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong className="record-cover-label">
                      {t(
                        coverageOptions.find(
                          (option) => option.value === record.draft.coverageTarget,
                        )!.label,
                      )}
                    </strong>
                    <span className="record-emirate">{t(record.draft.visaEmirate)}</span>
                  </td>
                  <td>
                    <span className="record-people-count">
                      <Users size={15} />
                      {insuredCount(record)}
                    </span>
                  </td>
                  <td>
                    <span className={`record-status ${record.status ?? 'prepared'}`}>
                      <span />
                      {t(inquiryStatus(record))}
                    </span>
                  </td>
                  <td className="record-created">{recordDate(record.createdAt, locale)}</td>
                  <td>
                    <a
                      className="record-open"
                      href={`#/inquiries/${record.id}`}
                      aria-label={`${t('View inquiry')} ${record.id}`}
                    >
                      <ArrowRight size={18} className="directional" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="records-empty">
              <MagnifyingGlass size={32} />
              <h2>{t('No matching inquiries.')}</h2>
              <p>{t('Try a different search or clear your filters.')}</p>
              <button className="button secondary" onClick={reset}>
                {t('Clear filters')}
              </button>
            </div>
          )}
        </div>
        <div className="records-table-footer">
          <span>
            {t('Showing')} <strong>{filtered.length}</strong> {t('of')} {records.length}{' '}
            {t('inquiries')}
          </span>
          <span className="records-sample-note">{t('Sample records are for preview only.')}</span>
        </div>
      </section>
    </main>
  )
}
