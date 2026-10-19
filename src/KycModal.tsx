import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ClipboardText,
  SpinnerGap,
  Users,
  WarningCircle,
} from '@phosphor-icons/react'
import type { Inquiry } from './health'
import { relationshipLabels } from './health'
import { Avatar, ChoiceGroup, Modal } from './ui'
import { useLanguage } from './language-context'
import { FOLLOW_UP_STATUS, saveHealthKyc } from './powerPagesApi'
import {
  answerError,
  buildKycSubmission,
  choicesFor,
  coveredPeople,
  emptyKycDraft,
  isKycSubmission,
  memberQuestions,
  needsDetails,
  sharedQuestions,
} from './kycQuestions'
import type { AnswerMap, KycAnswer, KycDraft, KycQuestion } from './kycQuestions'

export function KycModal({
  record,
  onClose,
  onUpdated,
}: {
  record?: Inquiry
  onClose: () => void
  onUpdated: (record: Inquiry) => void
}) {
  const { t, locale } = useLanguage()
  const [cache, setCache] = useState<Record<string, KycDraft>>({})
  const [steps, setSteps] = useState<Record<string, number>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const scroll = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const saved = isKycSubmission(record?.customerData?.kyc) ? record.customerData.kyc : null
  const draft = record ? (cache[record.id] ?? emptyKycDraft()) : emptyKycDraft()
  let people: ReturnType<typeof coveredPeople> = []
  let personError = ''
  try {
    if (record && !record.unreadable) people = coveredPeople(record)
  } catch (failure) {
    personError = failure instanceof Error ? failure.message : 'Member details are unavailable.'
  }
  const step = record ? Math.min(steps[record.id] ?? 0, people.length + 1) : 0
  const reviewStep = people.length + 1
  const person = step > 0 && step < reviewStep ? people[step - 1] : null
  const questions = person
    ? memberQuestions(person, draft.members[person.id] ?? {})
    : sharedQuestions(people)
  const answers = person ? (draft.members[person.id] ?? {}) : draft.household
  const editable =
    !saved &&
    record?.dataverseStatus === FOLLOW_UP_STATUS.kycRequired &&
    !record.unreadable &&
    !personError &&
    people.length > 0
  useEffect(() => {
    scroll.current?.scrollTo({ top: 0 })
    heading.current?.focus({ preventScroll: true })
  }, [step, record?.id])
  useEffect(() => {
    setErrors({})
    setError('')
  }, [record?.id])
  useEffect(() => {
    const unsaved = Object.values(cache).some(
      (d) => Object.keys(d.household).length || Object.keys(d.members).length,
    )
    if (!unsaved) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [cache])
  const changeStep = (next: number) => {
    if (!busy && record) {
      setErrors({})
      setError('')
      setSteps((current) => ({ ...current, [record.id]: next }))
    }
  }
  const update = (q: KycQuestion, value: string, details?: string) => {
    if (!record || busy) return
    setCache((current) => {
      const existing = current[record.id] ?? emptyKycDraft()
      const existingAnswers = person ? (existing.members[person.id] ?? {}) : existing.household
      const next = {
        ...existingAnswers,
        [q.id]: { value, details: details ?? existingAnswers[q.id]?.details ?? '' },
      }
      const eligible = person ? memberQuestions(person, next) : sharedQuestions(people)
      const visible = Object.fromEntries(
        Object.entries(next).filter(([id]) => eligible.some((question) => question.id === id)),
      )
      return {
        ...current,
        [record.id]: person
          ? { ...existing, members: { ...existing.members, [person.id]: visible } }
          : { ...existing, household: visible },
      }
    })
    setErrors((current) => ({ ...current, [q.id]: '' }))
    setError('')
  }
  const validate = (list: KycQuestion[], map: AnswerMap) =>
    Object.fromEntries(
      list.map((q) => [q.id, answerError(q, map[q.id])]).filter(([, message]) => message),
    )
  const focusInvalid = (list: Record<string, string>, at: number) =>
    requestAnimationFrame(() => {
      const id = Object.keys(list)[0]
      const detail = document.getElementById(`detail-${at}-${id}`)
      if (detail) detail.focus()
      else document.querySelector<HTMLInputElement>(`[data-field="kyc-${at}-${id}"] input`)?.focus()
    })
  const advance = async () => {
    if (!record || !editable || inFlight.current) return
    if (step < reviewStep) {
      const invalid = validate(questions, answers)
      if (Object.keys(invalid).length) {
        setErrors(invalid)
        focusInvalid(invalid, step)
        return
      }
      changeStep(step + 1)
      return
    }
    const sharedErrors = validate(sharedQuestions(people), draft.household)
    if (Object.keys(sharedErrors).length) {
      changeStep(0)
      requestAnimationFrame(() => {
        setErrors(sharedErrors)
        focusInvalid(sharedErrors, 0)
      })
      return
    }
    for (let index = 0; index < people.length; index++) {
      const p = people[index]
      const map = draft.members[p.id] ?? {}
      const invalid = validate(memberQuestions(p, map), map)
      if (Object.keys(invalid).length) {
        changeStep(index + 1)
        requestAnimationFrame(() => {
          setErrors(invalid)
          focusInvalid(invalid, index + 1)
        })
        return
      }
    }
    try {
      buildKycSubmission(record, draft)
    } catch (failure) {
      setError(failure instanceof Error ? t(failure.message) : t('Check your answers.'))
      document.getElementById('kyc-authorization')?.focus()
      return
    }
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      const updated = await saveHealthKyc(record, draft)
      setCache((current) => {
        const next = { ...current }
        delete next[record.id]
        return next
      })
      onUpdated(updated)
      onClose()
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : t('Your information could not be saved. Your answers have been kept.'),
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  const answered = (at: number) => {
    const p = at > 0 ? people[at - 1] : null
    const map = p ? (draft.members[p.id] ?? {}) : draft.household
    const list = p ? memberQuestions(p, map) : sharedQuestions(people)
    return !Object.keys(validate(list, map)).length
  }
  const answerRows = (rows: KycAnswer[]) => (
    <dl className="kyc-read-answers">
      {rows.map((a) => (
        <div key={a.questionId}>
          <dt>{locale === 'ar' && a.questionAr ? a.questionAr : a.question}</dt>
          <dd>
            <strong>{t(a.answer)}</strong>
            {a.details && <p>{a.details}</p>}
          </dd>
        </div>
      ))}
    </dl>
  )
  const title = person
    ? person.fullName
    : step === reviewStep
      ? 'One final check'
      : 'A little family background'
  return (
    <Modal
      title={saved ? 'KYC information' : 'Complete KYC information'}
      open={Boolean(record)}
      onClose={() => {
        if (!inFlight.current) onClose()
      }}
      dismissible={!busy}
      className="followup-dialog kyc-dialog"
    >
      <form
        className="followup-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void advance()
        }}
      >
        <div className="followup-scroll" ref={scroll}>
          {saved ? (
            <>
              <div className="followup-intro">
                <span className="followup-icon">
                  <CheckCircle size={26} weight="duotone" />
                </span>
                <div>
                  <h3>{t('Your health information is submitted')}</h3>
                  <p>
                    {t(
                      'These are the answers saved with this request. They can be viewed here without changing them.',
                    )}
                  </p>
                </div>
              </div>
              <details className="kyc-read-section" open>
                <summary>
                  <Users size={18} />
                  <span>{t('Family background')}</span>
                </summary>
                {answerRows(saved.household.answers)}
              </details>
              {saved.members.map((member) => (
                <details className="kyc-read-section" key={member.id}>
                  <summary>
                    <Avatar person={member} size="small" />
                    <span>
                      {member.fullName}
                      <small>
                        {t(
                          member.relationship === 'Applicant'
                            ? 'Applicant'
                            : (relationshipLabels[
                                member.relationship as keyof typeof relationshipLabels
                              ] ?? member.relationship),
                        )}{' '}
                        · {member.age} {t('years')}
                      </small>
                    </span>
                    <CheckCircle className="kyc-read-status" size={18} weight="fill" />
                  </summary>
                  {answerRows(member.answers)}
                </details>
              ))}
            </>
          ) : !editable ? (
            <div className="followup-error" role="alert">
              <WarningCircle size={20} />
              <p>
                {personError ||
                  t(
                    record?.unreadable
                      ? 'The saved member details could not be read. Please contact your advisor.'
                      : 'KYC information is not currently requested for this inquiry.',
                  )}
              </p>
            </div>
          ) : (
            <>
              <div className="followup-intro">
                <span className="followup-icon">
                  <ClipboardText size={25} />
                </span>
                <div>
                  <h3>{t('A few health details, one person at a time.')}</h3>
                  <p>
                    {t(
                      'Answer for the people covered by this request. It is okay to choose Not sure. Family history is asked just once.',
                    )}
                  </p>
                </div>
              </div>
              <nav className="kyc-people" aria-label={t('KYC sections')}>
                <button
                  type="button"
                  disabled={busy}
                  className={`${step === 0 ? 'active' : ''} ${answered(0) ? 'completed' : ''}`}
                  aria-current={step === 0 ? 'step' : undefined}
                  onClick={() => changeStep(0)}
                >
                  <Users size={19} />
                  <span>{t('Family background')}</span>
                  {answered(0) && <span className="sr-only">{t('Answered')}</span>}
                </button>
                {people.map((p, index) => (
                  <button
                    type="button"
                    disabled={busy}
                    className={`${step === index + 1 ? 'active' : ''} ${answered(index + 1) ? 'completed' : ''}`}
                    aria-current={step === index + 1 ? 'step' : undefined}
                    key={p.id}
                    onClick={() => changeStep(index + 1)}
                  >
                    <Avatar person={p} size="small" />
                    <span>
                      {p.fullName}
                      <small>
                        {t(
                          p.relationship === 'Applicant'
                            ? 'Applicant'
                            : (relationshipLabels[
                                p.relationship as keyof typeof relationshipLabels
                              ] ?? p.relationship),
                        )}{' '}
                        · {p.age} {t('years')}
                      </small>
                    </span>
                    {answered(index + 1) && <span className="sr-only">{t('Answered')}</span>}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={busy}
                  className={step === reviewStep ? 'active' : ''}
                  aria-current={step === reviewStep ? 'step' : undefined}
                  onClick={() => changeStep(reviewStep)}
                >
                  <ClipboardText size={19} />
                  <span>{t('Review')}</span>
                </button>
              </nav>
              <div className="kyc-step-heading">
                <span>
                  {t('Section')} {step + 1} / {reviewStep + 1}
                </span>
                <h3 ref={heading} tabIndex={-1}>
                  {t(title)}
                </h3>
                {person && (
                  <p>
                    {t(
                      person.relationship === 'Applicant'
                        ? 'Applicant'
                        : (relationshipLabels[
                            person.relationship as keyof typeof relationshipLabels
                          ] ?? person.relationship),
                    )}{' '}
                    · {person.age} {t('years')}
                  </p>
                )}
              </div>
              {step === reviewStep ? (
                <div className="kyc-review">
                  <div className="kyc-review-row">
                    <Users size={20} />
                    <span>{t('Family background')}</span>
                    <strong>{t(answered(0) ? 'Answered' : 'Needs answers')}</strong>
                    <button
                      type="button"
                      className="text-link"
                      disabled={busy}
                      onClick={() => changeStep(0)}
                    >
                      {t('Review')}
                    </button>
                  </div>
                  {people.map((p, index) => (
                    <div className="kyc-review-row" key={p.id}>
                      <Avatar person={p} size="small" />
                      <span>{p.fullName}</span>
                      <strong>{t(answered(index + 1) ? 'Answered' : 'Needs answers')}</strong>
                      <button
                        type="button"
                        className="text-link"
                        disabled={busy}
                        onClick={() => changeStep(index + 1)}
                      >
                        {t('Review')}
                      </button>
                    </div>
                  ))}
                  <label className="kyc-declaration">
                    <input
                      id="kyc-authorization"
                      type="checkbox"
                      checked={draft.authorized}
                      disabled={busy}
                      onChange={(event) => {
                        const authorized = event.target.checked
                        if (record)
                          setCache((current) => ({
                            ...current,
                            [record.id]: { ...(current[record.id] ?? emptyKycDraft()), authorized },
                          }))
                        setError('')
                      }}
                    />
                    <span>
                      {t(
                        'I am authorized to provide health information for everyone listed, including as a parent or guardian where needed. I confirm these answers are accurate to the best of my knowledge.',
                      )}
                    </span>
                  </label>
                  <p className="followup-note">
                    {t('After submission, these answers will be available to view only.')}
                  </p>
                </div>
              ) : (
                <fieldset className="kyc-question-list" key={step} disabled={busy}>
                  {questions.map((q, index) => (
                    <div className="kyc-question" key={q.id}>
                      {(index === 0 || q.group !== questions[index - 1].group) && (
                        <h4>{locale === 'ar' ? q.groupAr : q.group}</h4>
                      )}
                      <ChoiceGroup
                        name={`kyc-${step}-${q.id}`}
                        label={locale === 'ar' ? q.ar : q.label}
                        options={choicesFor(q).map((value) => ({ value, label: value }))}
                        value={answers[q.id]?.value ?? ''}
                        onChange={(value) => update(q, value)}
                        error={errors[q.id] ? t(errors[q.id]) : undefined}
                        compact
                      />
                      {needsDetails(q, answers[q.id]?.value ?? '') && (
                        <div className="kyc-answer-detail">
                          <label htmlFor={`detail-${step}-${q.id}`}>
                            {locale === 'ar' ? q.detailHintAr : q.detailHint}
                          </label>
                          <textarea
                            id={`detail-${step}-${q.id}`}
                            rows={3}
                            maxLength={2000}
                            value={answers[q.id]?.details ?? ''}
                            aria-invalid={!!errors[q.id]}
                            aria-describedby={
                              errors[q.id] ? `kyc-${step}-${q.id}-error` : undefined
                            }
                            onChange={(event) =>
                              update(q, answers[q.id]?.value ?? '', event.target.value)
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </fieldset>
              )}
            </>
          )}
          {error && (
            <div className="followup-error" role="alert">
              <WarningCircle size={18} />
              <p>{error}</p>
            </div>
          )}
        </div>
        <div className="followup-footer">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={() => {
              if (saved || !editable || step === 0) onClose()
              else changeStep(step - 1)
            }}
          >
            {!saved && editable && step > 0 && <ArrowLeft size={17} className="directional" />}
            {t(saved || !editable || step === 0 ? 'Close' : 'Back')}
          </button>
          {editable && (
            <button type="submit" className="button primary" disabled={busy} aria-busy={busy}>
              {busy && <SpinnerGap size={18} className="integration-spinner" />}
              {t(
                busy
                  ? 'Submitting information'
                  : step === reviewStep
                    ? 'Submit KYC information'
                    : 'Continue',
              )}
              {!busy && <ArrowRight size={17} className="directional" />}
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
