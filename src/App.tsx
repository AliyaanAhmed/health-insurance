import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle, MagnifyingGlass, Plus, X } from '@phosphor-icons/react'
import { art, coverageOptions, createDraft, isMemberComplete } from './health'
import type { CoverageTarget, Draft, Inquiry as InquiryRecord, Stage } from './health'
import { LanguageProvider } from './i18n'
import { useLanguage } from './language-context'
import { Header, Landing, CoverageArtwork, Success, EmptyInquiries } from './Landing'
import { Inquiry } from './Inquiry'
import { ReviewContent } from './Summary'
import { Verification } from './Verification'
import { Avatar, Modal, PrimaryButton } from './ui'
import { navigate, stepPath, useRoute } from './useRoute'
import './App.css'

function initialTarget(): CoverageTarget {
  const value = new URLSearchParams(window.location.hash.split('?')[1]).get('for')
  return coverageOptions.some((option) => option.value === value)
    ? (value as CoverageTarget)
    : 'self'
}
function HealthApp() {
  const { t, locale } = useLanguage()
  const route = useRoute()
  const [draft, setDraft] = useState<Draft>(() => createDraft(initialTarget()))
  const [hasStarted, setHasStarted] = useState(() => route.startsWith('/inquiry/'))
  const [lastPath, setLastPath] = useState(() => stepPath('cover', 0) + `?for=${initialTarget()}`)
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null)
  const [coverageOpen, setCoverageOpen] = useState(false)
  const [pendingTarget, setPendingTarget] = useState<CoverageTarget>('self')
  const [draftVersion, setDraftVersion] = useState(0)
  const currentTarget = useRef(initialTarget())
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([])
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState<{ message: string; undo?: () => void } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialRoute = useRef(route)
  const path = route.split('?')[0]
  const inquiryPage = path.startsWith('/inquiry/')
  const parts = path.split('/')
  const rawStage = parts[2] as Stage
  const stage: Stage = ['cover', 'details', 'family', 'review'].includes(rawStage)
    ? rawStage === 'family' && draft.coverageTarget === 'self'
      ? 'review'
      : rawStage
    : 'cover'
  const group = Math.min(
    stage === 'cover' ? 3 : stage === 'details' ? 2 : 0,
    Math.max(0, Number(parts[3]) || 0),
  )
  const go = (stage: Stage, group = 0) =>
    navigate(stepPath(stage, group) + `?for=${draft.coverageTarget}`)
  useEffect(() => {
    document.title = `${inquiryPage ? t('New inquiry') : path === '/inquiries' ? t('My inquiries') : path === '/complete' ? t('Your inquiry preview is ready.') : t('Health insurance')} | InsureAI Health`
  }, [locale, t, inquiryPage, path])
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (inquiryPage) document.getElementById('step-heading')?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }, 0)
    return () => clearTimeout(focusTimer)
  }, [route, inquiryPage])
  useEffect(() => {
    if (
      initialRoute.current.startsWith('/inquiry/')
    )
      navigate(stepPath('cover', 0) + `?for=${initialTarget()}`)
    const onHashChange = () => {
      const next = window.location.hash.slice(1)
      if (!next.startsWith('/inquiry/')) return
      setLastPath(next)
      setHasStarted(true)
      const target = new URLSearchParams(next.split('?')[1]).get('for')
      if (coverageOptions.some((option) => option.value === target) && currentTarget.current !== target) {
        currentTarget.current = target as CoverageTarget
        setDraft(createDraft(target as CoverageTarget))
        setDraftVersion((version) => version + 1)
        setActiveMemberId(null)
        setVerifyOpen(false)
        setNotice(null)
        const firstStep = stepPath('cover', 0) + `?for=${target}`
        setLastPath(firstStep)
        navigate(firstStep)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])
  const notify = useCallback((message: string, undo?: () => void) => {
    if (timer.current) clearTimeout(timer.current)
    setNotice({ message, undo })
    if (!undo) timer.current = setTimeout(() => setNotice(null), 4500)
  }, [])
  const applyTarget = (target: CoverageTarget) => {
    const firstStep = stepPath('cover', 0) + `?for=${target}`
    currentTarget.current = target
    setDraft(createDraft(target))
    setDraftVersion((version) => version + 1)
    setHasStarted(true)
    setLastPath(firstStep)
    setActiveMemberId(null)
    setCoverageOpen(false)
    setVerifyOpen(false)
    setNotice(null)
    if (timer.current) clearTimeout(timer.current)
    navigate(firstStep)
  }
  const chooseTarget = (target: CoverageTarget) => applyTarget(target)
  const onVerified = () => {
    const snapshot = structuredClone(draft)
    snapshot.applicant.fullName = snapshot.applicant.fullName.trim()
    snapshot.applicant.email = snapshot.applicant.email.trim()
    if (snapshot.coverageTarget === 'self') snapshot.members = []
    setInquiries((current) => [
      {
        id: `HI-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        draft: snapshot,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
    setVerifyOpen(false)
    setDraft(createDraft())
    setHasStarted(false)
    setActiveMemberId(null)
    navigate('/complete')
  }
  const filtered = inquiries.filter((item) =>
    `${item.id} ${item.draft.applicant.fullName}`
      .toLowerCase()
      .includes(search.toLowerCase().trim()),
  )
  return (
    <div className="insureai-health">
      <Header page={path === '/inquiries' ? 'inquiries' : inquiryPage ? 'inquiry' : 'home'} />
      {inquiryPage ? (
        <Inquiry
          key={`${draftVersion}-${draft.coverageTarget}`}
          draft={draft}
          setDraft={setDraft}
          stage={stage}
          group={group}
          onNavigate={go}
          onHome={() => navigate('/')}
          onVerify={() => setVerifyOpen(true)}
          activeMemberId={activeMemberId}
          setActiveMemberId={setActiveMemberId}
          onChangeCoverage={() => {
            setPendingTarget(draft.coverageTarget)
            setCoverageOpen(true)
          }}
          notify={notify}
        />
      ) : path === '/complete' ? (
        <Success onInquiries={() => navigate('/inquiries')} />
      ) : path === '/inquiries' ? (
        <main id="main-content" className="inquiries-page">
          <div className="inquiries-heading">
            <div>
              <p className="eyebrow">InsureAI Health</p>
              <h1>{t('My inquiries')}</h1>
              <p>{t('Prepared inquiries appear here during this visit.')}</p>
            </div>
            <PrimaryButton onClick={() => navigate('/')}>
              <Plus />
              {t('Start an inquiry')}
            </PrimaryButton>
          </div>
          {hasStarted && (
            <div className="resume-inquiry">
              <Avatar person={draft.applicant} />
              <div>
                <strong>{t('Resume your inquiry')}</strong>
                <p>{t('Your answers are still here for this visit.')}</p>
              </div>
              <button className="button secondary" onClick={() => navigate(lastPath)}>
                {t('Resume')}
                <ArrowRight className="directional" />
              </button>
            </div>
          )}
          {inquiries.length ? (
            <>
              <div className="inquiries-toolbar">
                <div className="search-input">
                  <MagnifyingGlass />
                  <input
                    type="search"
                    placeholder={t('Search inquiries…')}
                    aria-label={t('Search inquiries…')}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <span>
                  {filtered.length} / {inquiries.length}
                </span>
              </div>
              <div className="inquiry-records">
                {filtered.map((item) => (
                  <article className="inquiry-record" key={item.id}>
                    <img src={art.shield} alt="" width="1254" height="1254" />
                    <div>
                      <p className="record-reference">{item.id}</p>
                      <h2>{item.draft.applicant.fullName}</h2>
                      <p>
                        {t(
                          coverageOptions.find(
                            (option) => option.value === item.draft.coverageTarget,
                          )!.label,
                        )}{' '}
                        ·{' '}
                        {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE' : 'en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(item.createdAt))}
                      </p>
                      <span className="status complete">
                        <CheckCircle weight="fill" />
                        {t('Prepared in this session')}
                      </span>
                      {item.draft.applicant.salaryBand === 'pending_4000' && (
                        <span className="pending-salary-note">
                          {t('Salary band to be confirmed')}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => setSelectedInquiry(item)}
                    >
                      {t('View details')}
                      <ArrowRight className="directional" />
                    </button>
                  </article>
                ))}
                {!filtered.length && (
                  <div className="no-results">
                    <MagnifyingGlass size={30} />
                    <h2>{t('No matching inquiries.')}</h2>
                    <p>{t('Try another name or reference.')}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyInquiries onStart={() => navigate('/')} />
          )}
        </main>
      ) : (
        <Landing
          onChoose={chooseTarget}
          resume={hasStarted ? () => navigate(lastPath) : undefined}
        />
      )}
      <Modal
        title="Change who needs cover"
        open={coverageOpen}
        onClose={() => setCoverageOpen(false)}
      >
        <p className="modal-description">{t('Changing cover starts a new inquiry and clears all previous answers.')}</p>
        <div className="modal-coverage-options">
          {coverageOptions.map((option) => (
            <label
              className={`coverage-choice ${pendingTarget === option.value ? 'selected' : ''}`}
              key={option.value}
            >
              <input
                type="radio"
                name="change-coverage"
                value={option.value}
                checked={pendingTarget === option.value}
                onChange={() => setPendingTarget(option.value)}
              />
              <CoverageArtwork target={option.value} />
              <span className="coverage-choice-copy">
                <strong>{t(option.label)}</strong>
                <span>{t(option.helper)}</span>
              </span>
              <span className="radio-indicator">
                {pendingTarget === option.value && <CheckCircle weight="fill" />}
              </span>
            </label>
          ))}
        </div>
        <PrimaryButton onClick={() => chooseTarget(pendingTarget)}>
          {t('Apply changes')}
        </PrimaryButton>
      </Modal>
      {verifyOpen && (
        <Verification
          open
          mobile={draft.applicant.mobile}
          onClose={() => setVerifyOpen(false)}
          onEditMobile={() => {
            setVerifyOpen(false)
            go('details', 2)
            setTimeout(() => document.getElementById('mobile')?.focus(), 50)
          }}
          onVerified={onVerified}
        />
      )}
      <Modal
        title="Your health cover"
        open={Boolean(selectedInquiry)}
        onClose={() => setSelectedInquiry(null)}
        className="record-modal"
      >
        {selectedInquiry && (
          <>
            <p className="preview-reference">
              {selectedInquiry.id} · {t('Prepared in this session')}
            </p>
            <ReviewContent draft={selectedInquiry.draft} />
          </>
        )}
      </Modal>
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {notice && (
          <div className="toast">
            <CheckCircle weight="fill" />
            <span>{t(notice.message)}</span>
            {notice.undo && (
              <button
                onClick={() => {
                  notice.undo?.()
                  setNotice(null)
                }}
              >
                {t('Undo')}
              </button>
            )}
            <button className="icon-button" onClick={() => setNotice(null)} aria-label={t('Close')}>
              <X />
            </button>
          </div>
        )}
      </div>
      <div className="sr-only" aria-live="polite">
        {inquiryPage &&
          `${t('Step')} ${stage === 'cover' ? 1 : stage === 'details' ? 2 : stage === 'family' ? 3 : draft.coverageTarget === 'self' ? 3 : 4}: ${t(stage === 'details' && draft.coverageTarget === 'dependents_only' ? 'Sponsor details' : stage === 'cover' ? 'Cover' : stage === 'family' ? 'Family' : 'Review')}. ${stage === 'family' ? `${draft.members.filter(isMemberComplete).length} ${t('people complete')}` : ''}`}
      </div>
    </div>
  )
}
export default function App() {
  return (
    <LanguageProvider>
      <HealthApp />
    </LanguageProvider>
  )
}
