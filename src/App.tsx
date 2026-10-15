import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle, X } from '@phosphor-icons/react'
import { coverageOptions, createDraft, isMemberComplete, stageLabels, stagesFor } from './health'
import type { CoverageTarget, Draft, Inquiry as InquiryRecord, Stage } from './health'
import { LanguageProvider } from './i18n'
import { useLanguage } from './language-context'
import { Header, Landing, CoverageArtwork, Success } from './Landing'
import { Inquiry } from './Inquiry'
import { InquiryList } from './InquiryList'
import { InquiryView } from './InquiryView'
import { sampleInquiries } from './inquiryData'
import { PageLoader } from './PageLoader'
import { Modal, PrimaryButton } from './ui'
import { navigate, stepPath, useRoute } from './useRoute'
import './App.css'
import './InquiryRecords.css'

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
  const [creating, setCreating] = useState(false)
  const [createdRecordId, setCreatedRecordId] = useState<string | null>(null)
  const creatingRef = useRef(false)
  const creationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [inquiries, setInquiries] = useState<InquiryRecord[]>(sampleInquiries)
  const [notice, setNotice] = useState<{ message: string; undo?: () => void } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialRoute = useRef(route)
  const path = route.split('?')[0]
  const inquiryPage = path.startsWith('/inquiry/')
  const parts = path.split('/')
  const rawStage = parts[2] as Stage
  const stage: Stage = ['cover', 'details', 'family', 'documents', 'review'].includes(rawStage)
    ? rawStage === 'family' && draft.coverageTarget === 'self'
      ? 'documents'
      : rawStage
    : 'cover'
  const group = Math.min(
    stage === 'cover' ? 3 : stage === 'details' ? 2 : 0,
    Math.max(0, Number(parts[3]) || 0),
  )
  const go = (stage: Stage, group = 0) =>
    navigate(stepPath(stage, group) + `?for=${draft.coverageTarget}`)
  useEffect(() => {
    document.title = `${inquiryPage ? t('New inquiry') : path.startsWith('/inquiries/') ? t('View inquiry') : path === '/inquiries' ? t('My inquiries') : path === '/complete' ? t('Your inquiry preview is ready.') : t('Health insurance')} | InsureAI Health`
  }, [locale, t, inquiryPage, path])
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (inquiryPage) document.getElementById('step-heading')?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }, 0)
    return () => clearTimeout(focusTimer)
  }, [route, inquiryPage])
  useEffect(() => {
    if (initialRoute.current.startsWith('/inquiry/'))
      navigate(stepPath('cover', 0) + `?for=${initialTarget()}`)
    const onHashChange = () => {
      const next = window.location.hash.slice(1)
      if (!next.startsWith('/inquiry/')) return
      setLastPath(next)
      setHasStarted(true)
      const target = new URLSearchParams(next.split('?')[1]).get('for')
      if (
        coverageOptions.some((option) => option.value === target) &&
        currentTarget.current !== target
      ) {
        currentTarget.current = target as CoverageTarget
        setDraft(createDraft(target as CoverageTarget))
        setDraftVersion((version) => version + 1)
        setActiveMemberId(null)
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
    setNotice(null)
    if (timer.current) clearTimeout(timer.current)
    navigate(firstStep)
  }
  const chooseTarget = (target: CoverageTarget) => applyTarget(target)
  useEffect(() => {
    if (!inquiryPage) {
      if (creationTimer.current) clearTimeout(creationTimer.current)
      creatingRef.current = false
      setCreating(false)
    }
    if (path.startsWith('/inquiries/')) setCreatedRecordId(null)
  }, [path, inquiryPage])
  useEffect(
    () => () => {
      if (creationTimer.current) clearTimeout(creationTimer.current)
    },
    [],
  )
  const createInquiry = () => {
    if (creatingRef.current) return
    creatingRef.current = true
    const snapshot = structuredClone(draft)
    snapshot.applicant.fullName = snapshot.applicant.fullName.trim()
    snapshot.applicant.email = snapshot.applicant.email.trim()
    if (snapshot.coverageTarget === 'self') snapshot.members = []
    const id = 'HI-' + crypto.randomUUID().slice(0, 6).toUpperCase()
    setNotice(null)
    if (timer.current) clearTimeout(timer.current)
    setCreating(true)
    creationTimer.current = setTimeout(() => {
      setInquiries((current) => [
        { id, draft: snapshot, documents: snapshot.documents, createdAt: new Date().toISOString() },
        ...current,
      ])
      setCreatedRecordId(id)
      setDraft(createDraft())
      setHasStarted(false)
      setActiveMemberId(null)
      creatingRef.current = false
      navigate('/inquiries/' + id)
    }, 850)
  }
  return (
    <div className="insureai-health">
      <Header
        page={path.startsWith('/inquiries') ? 'inquiries' : inquiryPage ? 'inquiry' : 'home'}
      />
      {creating && inquiryPage ? (
        <PageLoader
          label="Creating your inquiry"
          description="Bringing your details and documents together."
        />
      ) : inquiryPage ? (
        <Inquiry
          key={`${draftVersion}-${draft.coverageTarget}`}
          draft={draft}
          setDraft={setDraft}
          stage={stage}
          group={group}
          onNavigate={go}
          onHome={() => navigate('/')}
          onCreate={createInquiry}
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
      ) : path.startsWith('/inquiries/') ? (
        <InquiryView
          key={path}
          record={inquiries.find((record) => record.id === path.split('/')[2])}
          skipLoader={createdRecordId === path.split('/')[2]}
        />
      ) : path === '/inquiries' ? (
        <InquiryList records={inquiries} hasStarted={hasStarted} lastPath={lastPath} />
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
        <p className="modal-description">
          {t('Changing cover starts a new inquiry and clears all previous answers.')}
        </p>
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
          `${t('Step')} ${stagesFor(draft.coverageTarget).indexOf(stage) + 1}: ${t(stage === 'details' && draft.coverageTarget === 'dependents_only' ? 'Sponsor details' : stageLabels[stage])}. ${stage === 'family' ? `${draft.members.filter(isMemberComplete).length} ${t('people complete')}` : ''}`}
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
