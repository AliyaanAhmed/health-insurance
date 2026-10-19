import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CheckCircle, X } from '@phosphor-icons/react'
import {
  coverageOptions,
  createDraft,
  isMemberComplete,
  coverErrors,
  applicantErrors,
  stageLabels,
  stagesFor,
} from './health'
import type { CoverageTarget, Draft, Inquiry as InquiryRecord, Stage } from './health'
import { LanguageProvider } from './i18n'
import { useLanguage } from './language-context'
import { Header, Landing, CoverageArtwork, Success } from './Landing'
import { Inquiry } from './Inquiry'
import { InquiryList } from './InquiryList'
import { InquiryView } from './InquiryView'
import { EmiratesIdModal } from './EmiratesIdModal'
import { KycModal } from './KycModal'
import { loadHealthProduct, loadHealthRequests, submitHealthRequest } from './powerPagesApi'
import type { SubmissionCheckpoint } from './powerPagesApi'
import { useHealthCatalog } from './useHealthCatalog'
import { HealthIntegrationContext } from './healthIntegrationContext'
import { PageLoader } from './PageLoader'
import { Modal, PrimaryButton } from './ui'
import { navigate, stepPath, useRoute } from './useRoute'
import './App.css'
import './InquiryRecords.css'
import './SimpleExperience.css'
import './FollowUps.css'

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
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null)
  const creatingRef = useRef(false)
  const submission = useRef<SubmissionCheckpoint | null>(null)
  const creationFinished = useRef(false)
  const skipNextRequestsLoad = useRef(false)
  const [creationLabel, setCreationLabel] = useState('Creating your request')
  const [submitError, setSubmitError] = useState('')
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestsError, setRequestsError] = useState('')
  const [requestsRevision, setRequestsRevision] = useState(0)
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([])
  const [followUp, setFollowUp] = useState<{ kind: 'identity' | 'kyc'; id: string } | null>(null)
  const [notice, setNotice] = useState<{ message: string; undo?: () => void } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialRoute = useRef(route)
  const path = route.split('?')[0]
  const inquiryPage = path.startsWith('/inquiry/')
  const requestsPage = path.startsWith('/inquiries')
  const integration = useHealthCatalog(draft, inquiryPage ? 'create' : 'idle')
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
    document.title = `${inquiryPage ? t('New request') : path.startsWith('/inquiries/') ? t('View inquiry') : path === '/inquiries' ? t('My Requests') : path === '/complete' ? t('Your inquiry preview is ready.') : t('Health insurance')} | InsureAI Health`
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
    setSubmitError('')
    submission.current = null
    if (timer.current) clearTimeout(timer.current)
    navigate(firstStep)
  }
  const chooseTarget = (target: CoverageTarget) => applyTarget(target)
  useEffect(() => {
    if (!inquiryPage && creationFinished.current) {
      creationFinished.current = false
      setCreating(false)
      setDraft(createDraft())
    }
    if (path.startsWith('/inquiries/')) {
      setSelectedInquiryId(path.split('/')[2])
      navigate('/inquiries')
    }
  }, [path, inquiryPage])
  useLayoutEffect(() => {
    if (!requestsPage) return
    if (skipNextRequestsLoad.current) {
      skipNextRequestsLoad.current = false
      setRequestsLoading(false)
      return
    }
    let cancelled = false
    setRequestsLoading(true)
    setRequestsError('')
    const load = async () => {
      const product = integration.catalog?.product ?? (await loadHealthProduct()).product
      const records = await loadHealthRequests(product.id)
      if (!cancelled)
        setInquiries((current) => {
          const combined = new Map(records.map((record) => [record.id, record]))
          if (selectedInquiryId) {
            const created = current.find((record) => record.id === selectedInquiryId)
            if (created && !combined.has(created.id)) combined.set(created.id, created)
          }
          return [...combined.values()]
        })
    }
    void load()
      .catch((error) => {
        if (!cancelled)
          setRequestsError(error instanceof Error ? error.message : 'Unable to load your requests.')
      })
      .finally(() => {
        if (!cancelled) setRequestsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [requestsPage, requestsRevision])
  const createInquiry = async () => {
    if (creatingRef.current) return
    setSubmitError('')
    if (
      Object.keys(coverErrors(draft)).length ||
      Object.keys(applicantErrors(draft.applicant)).length ||
      (draft.coverageTarget !== 'self' &&
        (!draft.members.length || !draft.members.every(isMemberComplete)))
    ) {
      setSubmitError('Complete and save all required details before creating your request.')
      return
    }
    if (integration.loading || integration.error || !integration.catalog) {
      setSubmitError('Load the current plan and premium rates before creating your request.')
      return
    }
    if (!integration.plan) {
      setSubmitError('Choose an insurance plan before creating your request.')
      return
    }
    const data = structuredClone(integration.customerData)
    if (!data.premium.complete) {
      setSubmitError(
        'Every insured person needs a matching premium rate for their age and visa emirate.',
      )
      return
    }
    const signature = integration.customerDataJson
    if (submission.current?.quoteAttempted && submission.current.signature !== signature) {
      setSubmitError(
        'A previous request may already have been saved. Check My Requests before changing and resubmitting these details.',
      )
      return
    }
    if (!submission.current || submission.current.signature !== signature)
      submission.current = { signature, quoteId: crypto.randomUUID(), quoteAttempted: false }
    creatingRef.current = true
    creationFinished.current = false
    setCreating(true)
    setCreationLabel('Finding your contact')
    setNotice(null)
    if (timer.current) clearTimeout(timer.current)
    let completed = false
    try {
      const record = await submitHealthRequest(data, submission.current, setCreationLabel)
      setCreationLabel('Loading your requests')
      let records: InquiryRecord[] = []
      try {
        records = await loadHealthRequests(data.product!.id)
      } catch (error) {
        setRequestsError(
          error instanceof Error
            ? error.message
            : 'Your request was created, but the list could not be refreshed.',
        )
      }
      setInquiries([record, ...records.filter((item) => item.id !== record.id)])
      setSelectedInquiryId(record.id)
      setHasStarted(false)
      setActiveMemberId(null)
      submission.current = null
      completed = true
      creationFinished.current = true
      skipNextRequestsLoad.current = !requestsPage
      if (window.location.hash === '#/inquiries') {
        setCreating(false)
        setDraft(createDraft())
        creationFinished.current = false
      }
      navigate('/inquiries')
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Your request could not be created. Your answers have been kept.',
      )
    } finally {
      creatingRef.current = false
      if (!completed) setCreating(false)
    }
  }
  return (
    <HealthIntegrationContext.Provider value={integration}>
      <div className="insureai-health">
        <Header
          page={path.startsWith('/inquiries') ? 'inquiries' : inquiryPage ? 'inquiry' : 'home'}
        />
        {!creating && inquiryPage && submitError && (
          <div className="request-operation-error" role="alert">
            <strong>{t('Request not completed')}</strong>
            <p>{submitError}</p>
          </div>
        )}
        {creating ? (
          <PageLoader
            label={creationLabel}
            allowBack={false}
            description="Bringing your cover details together."
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
        ) : path.startsWith('/inquiries') ? (
          <InquiryList
            records={inquiries}
            onOpen={setSelectedInquiryId}
            loading={requestsLoading}
            error={requestsError}
            onRetry={() => setRequestsRevision((value) => value + 1)}
            onAction={(kind, id) => setFollowUp({ kind, id })}
          />
        ) : (
          <Landing
            onChoose={chooseTarget}
            resume={hasStarted ? () => navigate(lastPath) : undefined}
          />
        )}
        <InquiryView
          record={inquiries.find((record) => record.id === selectedInquiryId)}
          onClose={() => setSelectedInquiryId(null)}
        />
        <EmiratesIdModal
          record={
            followUp?.kind === 'identity'
              ? inquiries.find((record) => record.id === followUp.id)
              : undefined
          }
          onClose={() => setFollowUp(null)}
          onUpdated={(record) => {
            setInquiries((current) =>
              current.map((item) => (item.id === record.id ? record : item)),
            )
            if (record.dataverseStatus === 751820017) notify('Emirates ID documents submitted.')
          }}
        />
        <KycModal
          record={
            followUp?.kind === 'kyc'
              ? inquiries.find((record) => record.id === followUp.id)
              : undefined
          }
          onClose={() => setFollowUp(null)}
          onUpdated={(record) => {
            setInquiries((current) =>
              current.map((item) => (item.id === record.id ? record : item)),
            )
            notify('KYC information submitted.')
          }}
        />
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
              <button
                className="icon-button"
                onClick={() => setNotice(null)}
                aria-label={t('Close')}
              >
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
    </HealthIntegrationContext.Provider>
  )
}
export default function App() {
  return (
    <LanguageProvider>
      <HealthApp />
    </LanguageProvider>
  )
}
