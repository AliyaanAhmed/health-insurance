import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  ArrowLeft,
  Buildings,
  Briefcase,
  Files,
  CaretDown,
  Check,
  CheckCircle,
  Info,
  MagnifyingGlass,
  MapPin,
  Plus,
  ShieldCheck,
  Trash,
  User,
  Users,
  WarningCircle,
} from '@phosphor-icons/react'
import {
  applicantErrors,
  ageOf,
  art,
  countryCodes,
  countryName,
  coverErrors,
  emirates,
  isApplicantComplete,
  isMemberComplete,
  maritalOptions,
  normalizeDigits,
  personErrors,
  relationshipLabels,
  stageLabels,
  stagesFor,
  statusOptions,
  visaOptions,
} from './health'
import type { Applicant, Draft, Errors, Member, Relationship, Stage } from './health'
import { useLanguage } from './language-context'
import {
  Avatar,
  ChoiceGroup,
  DateField,
  ErrorText,
  GenderGroup,
  Hint,
  Modal,
  PrimaryButton,
  Status,
  TextField,
} from './ui'
import { focusInvalid } from './formUtils'
import { ReviewContent, Summary } from './Summary'
import { DocumentUpload } from './DocumentUpload'
import { InquiryDocuments } from './InquiryDocuments'

function CountryPicker({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const { t, locale } = useLanguage()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const countries = useMemo(
    () =>
      countryCodes
        .map((code) => ({ code, name: countryName(code, locale), english: countryName(code) }))
        .sort((a, b) => a.name.localeCompare(b.name, locale)),
    [locale],
  )
  const filtered = countries.filter((country) =>
    `${country.name} ${country.english} ${country.code}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  )
  return (
    <div className="country-field" data-field="nationalityCode">
      <label className="field-label">{t('Nationality')}</label>
      <button
        type="button"
        className="select-trigger"
        onClick={() => {
          setSearch('')
          setOpen(true)
        }}
        aria-haspopup="dialog"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'nationalityCode-error' : undefined}
      >
        <span>{value ? countryName(value, locale) : t('Choose your nationality')}</span>
        <CaretDown />
      </button>
      <ErrorText error={error} id="nationalityCode-error" />
      <div className="country-shortcuts">
        {['IN', 'PK', 'PH', 'EG', 'GB'].map((code) => (
          <button
            type="button"
            key={code}
            className={value === code ? 'selected' : ''}
            onClick={() => onChange(code)}
          >
            {countryName(code, locale)}
            {value === code && <Check size={13} />}
          </button>
        ))}
      </div>
      <Modal
        title="Choose your nationality"
        open={open}
        onClose={() => setOpen(false)}
        className="country-modal"
      >
        <div className="search-input">
          <MagnifyingGlass />
          <input
            autoFocus
            aria-label={t('Search countries…')}
            placeholder={t('Search countries…')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="country-results">
          {filtered.length ? (
            filtered.map((country) => (
              <button
                className={value === country.code ? 'selected' : ''}
                key={country.code}
                onClick={() => {
                  onChange(country.code)
                  setOpen(false)
                }}
                type="button"
                aria-pressed={value === country.code}
              >
                <span>{country.name}</span>
                <span className="country-code">{country.code}</span>
                {value === country.code && <Check />}
              </button>
            ))
          ) : (
            <p role="status">{t('No countries match your search.')}</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

function Stepper({
  draft,
  stage,
  onNavigate,
}: {
  draft: Draft
  stage: Stage
  onNavigate: (stage: Stage, group?: number) => void
}) {
  const { t } = useLanguage()
  const stages = stagesFor(draft.coverageTarget)
  const stepIcons = {
    cover: ShieldCheck,
    details: User,
    family: Users,
    documents: Files,
    review: CheckCircle,
  }
  const valid: Record<Stage, boolean> = {
    cover: Object.keys(coverErrors(draft)).length === 0,
    details: isApplicantComplete(draft),
    family: draft.members.length > 0 && draft.members.every(isMemberComplete),
    documents: draft.documentsConfirmed,
    review: false,
  }
  return (
    <nav className="stepper" aria-label={t('New inquiry')}>
      <ol>
        {stages.map((item, index) => {
          const StepIcon = stepIcons[item]
          const current = stage === item
          const canVisit =
            index === 0 || stages.slice(0, index).every((previous) => valid[previous])
          return (
            <li key={item} className={`${current ? 'current' : ''} ${valid[item] ? 'done' : ''}`}>
              <button
                type="button"
                onClick={() => onNavigate(item, 0)}
                disabled={!canVisit && !current}
                aria-current={current ? 'step' : undefined}
              >
                <span className="step-number">
                  <StepIcon weight={current || valid[item] ? 'fill' : 'regular'} />
                </span>
                <span>
                  <strong>
                    {t(
                      item === 'details' && draft.coverageTarget === 'dependents_only'
                        ? 'Sponsor details'
                        : stageLabels[item],
                    )}
                  </strong>
                  <small>
                    {t(current ? 'Current step' : valid[item] ? 'Completed' : 'Pending')}
                  </small>
                </span>
              </button>
              {index < stages.length - 1 && <span className="step-connector" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

const coverQuestions = [
  {
    title: 'Which visa are you on?',
    description: 'Your visa type helps us understand your cover.',
    field: 'visaType',
  },
  {
    title: 'What’s your nationality?',
    description: 'Search your country or choose a quick option below.',
    field: 'nationalityCode',
  },
  {
    title: 'Where was your visa issued?',
    description: 'Choose the emirate on your visa, even if you live elsewhere.',
    field: 'visaEmirate',
  },
  {
    title: 'New visa or renewal?',
    description: 'Choose the status that best describes your visa today.',
    field: 'visaStatus',
  },
]
function QuestionProgress({ current, total }: { current: number; total: number }) {
  const { t } = useLanguage()
  return (
    <div className="question-progress">
      <span>
        {t('Question')} {current + 1} {t('of')} {total}
      </span>
      <div aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i <= current ? 'filled' : ''} />
        ))}
      </div>
    </div>
  )
}

export function Inquiry({
  draft,
  setDraft,
  stage,
  group,
  onNavigate,
  onHome,
  onCreate,
  activeMemberId,
  setActiveMemberId,
  onChangeCoverage,
  notify,
}: {
  draft: Draft
  setDraft: Dispatch<SetStateAction<Draft>>
  stage: Stage
  group: number
  onNavigate: (stage: Stage, group?: number) => void
  onHome: () => void
  onCreate: () => void
  activeMemberId: string | null
  setActiveMemberId: (id: string | null) => void
  onChangeCoverage: () => void
  notify: (message: string, undo?: () => void) => void
}) {
  const { t } = useLanguage()
  const errorScope = `${stage}/${group}/${activeMemberId}`
  const [errorState, setErrorState] = useState<{ scope: string; values: Errors }>({
    scope: errorScope,
    values: {},
  })
  const errors = errorState.scope === errorScope ? errorState.values : {}
  const setErrors = (next: SetStateAction<Errors>) =>
    setErrorState((current) => ({
      scope: errorScope,
      values:
        typeof next === 'function'
          ? next(current.scope === errorScope ? current.values : {})
          : next,
    }))
  const [addOpen, setAddOpen] = useState(false)
  const sponsor = draft.coverageTarget === 'dependents_only'
  useEffect(() => {
    if (
      draft.members.some((member) => member.relationship === 'spouse' && member.gender !== 'female')
    ) {
      setDraft((current) => ({
        ...current,
        members: current.members.map((member) =>
          member.relationship === 'spouse' ? { ...member, gender: 'female' } : member,
        ),
      }))
    }
  }, [draft.members, setDraft])
  const active = draft.members.find((member) => member.id === activeMemberId)
  const completeMembers = draft.members.every(isMemberComplete) && draft.members.length > 0
  const nextIncomplete = draft.members.find((member) => !isMemberComplete(member))

  const clearError = (key: string) =>
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      delete next.form
      return next
    })
  const updateCover = (key: keyof Draft, value: string) => {
    const updated = { ...draft, [key]: value }
    setDraft((current) => ({ ...current, [key]: value }))
    clearError(key)
    if (stage === 'cover' && coverQuestions[group].field === key && !coverErrors(updated)[key]) {
      if (group < 3) onNavigate('cover', group + 1)
      else onNavigate('details', 0)
    }
  }
  const updateApplicant = (key: keyof Applicant, value: string) => {
    setDraft((current) => ({ ...current, applicant: { ...current.applicant, [key]: value } }))
    clearError(key)
  }
  const validateApplicantField = (key: string) => {
    const error = applicantErrors(draft.applicant)[key]
    setErrors((current) => ({ ...current, [key]: error ?? '' }))
  }
  const updateMember = (key: keyof Member, value: string) => {
    setDraft((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.id === activeMemberId ? { ...member, [key]: value, saved: false } : member,
      ),
    }))
    clearError(key)
  }
  const validateMemberField = (key: string) => {
    if (active) {
      const error = personErrors(active)[key]
      setErrors((current) => ({ ...current, [key]: error ?? '' }))
    }
  }
  const reportErrors = (next: Errors) => {
    setErrors(next)
    focusInvalid(Object.keys(next)[0])
  }
  const openMember = (id: string) => {
    setActiveMemberId(id)
    onNavigate('family', 0)
  }
  const addMember = (relationship: Relationship) => {
    const id = crypto.randomUUID()
    setDraft((current) => ({
      ...current,
      members: [
        ...current.members,
        {
          id,
          relationship,
          fullName: '',
          dateOfBirth: '',
          gender: relationship === 'spouse' ? 'female' : '',
          saved: false,
        },
      ],
    }))
    setActiveMemberId(id)
    setAddOpen(false)
    setErrors({})
    requestAnimationFrame(() => document.getElementById('member-fullName')?.focus())
  }
  const removeMember = (member: Member) => {
    const index = draft.members.findIndex((item) => item.id === member.id)
    setDraft((current) => ({
      ...current,
      members: current.members.filter((item) => item.id !== member.id),
    }))
    setActiveMemberId(null)
    notify('Member removed.', () => {
      setDraft((current) => ({
        ...current,
        members: [...current.members.slice(0, index), member, ...current.members.slice(index)],
      }))
      setActiveMemberId(member.id)
    })
  }
  function next() {
    if (stage === 'cover') {
      const field = coverQuestions[group].field
      const error = coverErrors(draft)[field]
      if (error) {
        reportErrors({ [field]: error })
        return
      }
      if (group < 3) onNavigate('cover', group + 1)
      else onNavigate('details', 0)
    } else if (stage === 'details') {
      const keys =
        group === 0
          ? ['gender', 'maritalStatus']
          : group === 1
            ? ['dateOfBirth', 'salaryBand']
            : ['fullName', 'email', 'mobile']
      const all = applicantErrors(draft.applicant)
      const next = Object.fromEntries(keys.filter((key) => all[key]).map((key) => [key, all[key]]))
      if (Object.keys(next).length) {
        reportErrors(next)
        return
      }
      if (group < 2) onNavigate('details', group + 1)
      else if (draft.coverageTarget === 'self') onNavigate('documents', 0)
      else onNavigate('family', 0)
    } else if (stage === 'family') {
      if (active) {
        const next = personErrors(active)
        if (Object.keys(next).length) {
          reportErrors(next)
          return
        }
        setDraft((current) => ({
          ...current,
          members: current.members.map((member) =>
            member.id === active.id
              ? { ...member, fullName: member.fullName.trim(), saved: true }
              : member,
          ),
        }))
        setActiveMemberId(null)
        notify('Member details saved.')
      } else if (!draft.members.length) setAddOpen(true)
      else if (nextIncomplete) setActiveMemberId(nextIncomplete.id)
      else onNavigate('documents', 0)
    } else if (stage === 'documents') {
      setDraft((current) => ({ ...current, documentsConfirmed: true }))
      onNavigate('review', 0)
    } else {
      const cover = coverErrors(draft)
      if (Object.keys(cover).length) {
        onNavigate(
          'cover',
          coverQuestions.findIndex((question) => Boolean(cover[question.field])),
        )
        return
      }
      const applicant = applicantErrors(draft.applicant)
      if (Object.keys(applicant).length) {
        onNavigate(
          'details',
          applicant.gender || applicant.maritalStatus
            ? 0
            : applicant.dateOfBirth || applicant.salaryBand
              ? 1
              : 2,
        )
        return
      }
      if (draft.coverageTarget !== 'self' && (!draft.members.length || nextIncomplete)) {
        onNavigate('family', 0)
        setActiveMemberId(nextIncomplete?.id ?? null)
        setErrors({
          form: draft.members.length
            ? 'Save all member details before continuing.'
            : 'Add at least one family member to continue.',
        })
        return
      }
      if (!draft.documentsConfirmed) {
        onNavigate('documents', 0)
        return
      }
      onCreate()
    }
  }
  function back() {
    if (group > 0) {
      onNavigate(stage, group - 1)
      return
    }
    const stages = stagesFor(draft.coverageTarget)
    const index = stages.indexOf(stage)
    if (!index) onHome()
    else {
      const previous = stages[index - 1]
      onNavigate(previous, previous === 'cover' ? 3 : previous === 'details' ? 2 : 0)
    }
  }
  const title =
    stage === 'cover'
      ? 'Let’s start with your cover.'
      : stage === 'details'
        ? group === 0
          ? sponsor
            ? 'A little about the sponsor.'
            : 'A little about you.'
          : group === 1
            ? 'Your age & salary.'
            : 'How can we reach you?'
        : stage === 'family'
          ? 'Let’s add the people you love.'
          : stage === 'documents'
            ? 'Add your documents.'
            : 'One last look.'
  const description =
    stage === 'cover'
      ? 'A few details to point us in the right direction.'
      : stage === 'details'
        ? group === 0
          ? 'We’ll keep this simple. Let’s begin with the basics.'
          : group === 1
            ? 'These details help us understand your needs.'
            : 'Keep your contact details handy for the next step.'
        : stage === 'family'
          ? 'We’ll guide you through each person, one at a time.'
          : stage === 'documents'
            ? 'A few supporting documents can help complete your inquiry.'
            : 'Check the details below. You can still change anything.'
  const primaryLabel =
    stage === 'family'
      ? active
        ? 'Save member'
        : !draft.members.length
          ? 'Add person'
          : nextIncomplete
            ? 'Open next member'
            : 'Continue to documents'
      : stage === 'review'
        ? 'Create Inquiry'
        : stage === 'documents'
          ? 'Continue to review'
          : 'Continue'
  const hasErrors = Object.values(errors).some(Boolean)
  return (
    <div className="inquiry-layout">
      <div className="inquiry-navigation">
        <div className="breadcrumb">
          <a href="#/">{t('Health insurance')}</a>
          <span>/</span>
          <span>{t('New inquiry')}</span>
        </div>
        <Stepper draft={draft} stage={stage} onNavigate={onNavigate} />
      </div>
      <main className="inquiry-main" id="main-content">
        <div
          className={`inquiry-intro ${stage === 'family' ? 'family-intro' : ''}`}
          key={`intro-${stage}-${group}`}
        >
          <div>
            <p className="eyebrow">
              {t(
                stage === 'family'
                  ? 'Family'
                  : stage === 'review'
                    ? 'Ready when you are.'
                    : 'New inquiry',
              )}
            </p>
            <h1 tabIndex={-1} id="step-heading">
              {t(title)}
            </h1>
            <p>{t(description)}</p>
          </div>
        </div>
        {sponsor && stage === 'details' && (
          <Hint className="sponsor-notice">
            <strong>{t('You’re the sponsor, not an insured member.')}</strong>
            <br />
            {t('Your family’s cover will include the people you add in the next step.')}
          </Hint>
        )}
        <form
          autoComplete="off"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            next()
          }}
        >
          {hasErrors && (
            <div className="error-summary" role="alert">
              <WarningCircle size={20} />
              {t(errors.form || 'Please check the highlighted fields.')}
            </div>
          )}
          <div className={`editor-surface stage-${stage}`} key={`${stage}-${group}`}>
            {stage === 'cover' && (
              <>
                <QuestionProgress current={group} total={4} />
                <h2 className="question-heading">{t(coverQuestions[group].title)}</h2>
                <p className="question-description">{t(coverQuestions[group].description)}</p>
                {group === 0 && (
                  <ChoiceGroup
                    name="visaType"
                    label="Visa type"
                    value={draft.visaType}
                    onChange={(value) => updateCover('visaType', value)}
                    error={errors.visaType}
                    className="visa-choices hide-legend"
                    options={visaOptions.map((option, index) => ({
                      ...option,
                      icon: index ? (
                        <Buildings size={29} weight="duotone" />
                      ) : (
                        <Briefcase size={29} weight="duotone" />
                      ),
                    }))}
                  />
                )}
                {group === 1 && (
                  <CountryPicker
                    value={draft.nationalityCode}
                    onChange={(value) => updateCover('nationalityCode', value)}
                    error={errors.nationalityCode}
                  />
                )}
                {group === 2 && (
                  <ChoiceGroup
                    name="visaEmirate"
                    label="Visa emirate"
                    value={draft.visaEmirate}
                    onChange={(value) => updateCover('visaEmirate', value)}
                    error={errors.visaEmirate}
                    className="emirate-choices hide-legend"
                    compact
                    options={emirates.map((emirate) => ({
                      value: emirate,
                      label: emirate,
                      helper:
                        emirate === 'Abu Dhabi'
                          ? 'DoH rules'
                          : emirate === 'Dubai'
                            ? 'DHA rules'
                            : 'MoH rules',
                      icon: <MapPin size={19} />,
                    }))}
                  />
                )}
                {group === 3 && (
                  <ChoiceGroup
                    name="visaStatus"
                    label="Visa status"
                    value={draft.visaStatus}
                    onChange={(value) => updateCover('visaStatus', value)}
                    error={errors.visaStatus}
                    className="status-choices hide-legend"
                    options={statusOptions}
                  />
                )}
              </>
            )}
            {stage === 'details' && (
              <>
                <QuestionProgress current={group} total={3} />
                {group === 0 && (
                  <div className="personal-fields">
                    <GenderGroup
                      value={draft.applicant.gender}
                      onChange={(value) => updateApplicant('gender', value)}
                      error={errors.gender}
                    />
                    <ChoiceGroup
                      name="maritalStatus"
                      label="Marital status"
                      compact
                      value={draft.applicant.maritalStatus}
                      onChange={(value) => updateApplicant('maritalStatus', value)}
                      error={errors.maritalStatus}
                      className="marital-choices"
                      options={maritalOptions.map((value) => ({ value, label: value }))}
                    />
                  </div>
                )}
                {group === 1 && (
                  <div className="age-salary-fields">
                    <DateField
                      value={draft.applicant.dateOfBirth}
                      onChange={(value) => updateApplicant('dateOfBirth', value)}
                      error={errors.dateOfBirth}
                      onBlur={() => validateApplicantField('dateOfBirth')}
                    />
                    <ChoiceGroup
                      name="salaryBand"
                      label="Salary (AED per month)"
                      compact
                      value={draft.applicant.salaryBand}
                      onChange={(value) => updateApplicant('salaryBand', value)}
                      error={errors.salaryBand}
                      className="salary-choices"
                      options={[
                        { value: 'above_4000', label: 'Above AED 4,000' },
                        { value: 'below_4000', label: 'Below AED 4,000' },
                      ]}
                    />
                    <button
                      type="button"
                      className={`salary-boundary ${draft.applicant.salaryBand === 'pending_4000' ? 'selected' : ''}`}
                      aria-pressed={draft.applicant.salaryBand === 'pending_4000'}
                      onClick={() => updateApplicant('salaryBand', 'pending_4000')}
                    >
                      {draft.applicant.salaryBand === 'pending_4000' ? (
                        <CheckCircle weight="fill" />
                      ) : (
                        <Info />
                      )}
                      {t('I earn exactly AED 4,000')}
                    </button>
                    {draft.applicant.salaryBand === 'pending_4000' && (
                      <Hint className="warning-hint">
                        {t('We’ll keep this marked for confirmation.')}
                      </Hint>
                    )}
                  </div>
                )}
                {group === 2 && (
                  <div className="contact-fields">
                    <TextField
                      name="fullName"
                      label="Full name"
                      placeholder={t('First and last name')}
                      value={draft.applicant.fullName}
                      onChange={(event) => updateApplicant('fullName', event.target.value)}
                      onBlur={() => validateApplicantField('fullName')}
                      error={errors.fullName}
                      autoComplete="off"
                      maxLength={150}
                    />
                    <div className="field-row">
                      <TextField
                        name="email"
                        label="Email address"
                        type="email"
                        placeholder="you@example.com"
                        value={draft.applicant.email}
                        onChange={(event) => updateApplicant('email', event.target.value)}
                        onBlur={() => validateApplicantField('email')}
                        error={errors.email}
                        autoComplete="off"
                        maxLength={254}
                        dir="ltr"
                      />
                      <div className="field" data-field="mobile">
                        <label htmlFor="mobile">{t('Mobile number')}</label>
                        <div className={`phone-input ${errors.mobile ? 'invalid' : ''}`} dir="ltr">
                          <span>+971</span>
                          <input
                            id="mobile"
                            name="mobile"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="50 123 4567"
                            value={draft.applicant.mobile}
                            onChange={(event) =>
                              updateApplicant(
                                'mobile',
                                normalizeDigits(event.target.value).slice(0, 9),
                              )
                            }
                            onBlur={() => validateApplicantField('mobile')}
                            aria-invalid={Boolean(errors.mobile)}
                            aria-describedby={errors.mobile ? 'mobile-error' : 'mobile-hint'}
                          />
                        </div>
                        <ErrorText error={errors.mobile} id="mobile-error" />
                        <span className="field-hint" id="mobile-hint">
                          {t('9-digit UAE mobile number')}
                        </span>
                      </div>
                    </div>
                    <Hint>{t('Your mobile number is used for verification.')}</Hint>
                  </div>
                )}
              </>
            )}
            {stage === 'family' && (
              <>
                <div className="member-switcher">
                  {!sponsor && (
                    <button
                      type="button"
                      className="member-tile applicant-tile"
                      onClick={() => onNavigate('details', 0)}
                    >
                      <Avatar person={draft.applicant} />
                      <span>
                        <strong>{t('You')}</strong>
                        <Status complete={isApplicantComplete(draft)} />
                      </span>
                    </button>
                  )}
                  {draft.members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      className={`member-tile ${member.id === activeMemberId ? 'active' : ''}`}
                      onClick={() => setActiveMemberId(member.id)}
                      aria-current={member.id === activeMemberId ? 'true' : undefined}
                    >
                      <Avatar person={member} relationship={member.relationship} />
                      <span>
                        <strong>
                          {member.fullName.trim().split(/\s/)[0] ||
                            t(relationshipLabels[member.relationship])}
                        </strong>
                        <Status
                          complete={member.id !== activeMemberId && isMemberComplete(member)}
                          editing={member.id === activeMemberId}
                        />
                      </span>
                    </button>
                  ))}
                  <button
                    className="member-tile add-person-tile"
                    type="button"
                    onClick={() => setAddOpen(true)}
                  >
                    <span className="add-person-icon">
                      <Plus size={25} />
                    </span>
                    <span>{t('Add person')}</span>
                  </button>
                </div>
                {active ? (
                  <div className="member-editor" key={active.id}>
                    <div className="member-editor-heading">
                      <div>
                        <p className="member-role">{t(relationshipLabels[active.relationship])}</p>
                        <h2>
                          {t('A little about {name}').replace(
                            '{name}',
                            active.fullName.trim().split(/\s/)[0] || t('your family member'),
                          )}
                        </h2>
                      </div>
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeMember(active)}
                      >
                        <Trash size={18} />
                        {t('Remove')}
                      </button>
                    </div>
                    <div
                      className={`member-fields ${active.relationship === 'spouse' ? 'spouse-fields' : ''}`}
                    >
                      <TextField
                        id="member-fullName"
                        name="fullName"
                        label="Full name"
                        placeholder={t('First and last name')}
                        value={active.fullName}
                        maxLength={150}
                        onChange={(event) => updateMember('fullName', event.target.value)}
                        onBlur={() => validateMemberField('fullName')}
                        error={errors.fullName}
                        autoComplete="off"
                      />
                      <DateField
                        name="member-dateOfBirth"
                        value={active.dateOfBirth}
                        onChange={(value) => updateMember('dateOfBirth', value)}
                        error={errors.dateOfBirth}
                        onBlur={() => validateMemberField('dateOfBirth')}
                      />
                      {active.relationship !== 'spouse' && (
                        <GenderGroup
                          value={active.gender}
                          relationship={active.relationship}
                          dateOfBirth={active.dateOfBirth}
                          onChange={(value) => updateMember('gender', value)}
                          error={errors.gender}
                          child={
                            active.relationship === 'child' ||
                            (ageOf(active.dateOfBirth) !== null && ageOf(active.dateOfBirth)! < 18)
                          }
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`family-empty ${completeMembers ? 'family-ready' : ''}`}>
                    {completeMembers ? (
                      <CheckCircle weight="duotone" size={46} />
                    ) : (
                      <Users weight="duotone" size={46} />
                    )}
                    <h2>
                      {t(
                        completeMembers
                          ? 'Everyone’s details are ready.'
                          : draft.members.length
                            ? 'Member details saved.'
                            : 'Add your first family member',
                      )}
                    </h2>
                    <p>
                      {t(
                        completeMembers
                          ? 'Your next step is a quick review.'
                          : 'We’ll guide you through each person, one at a time.',
                      )}
                    </p>
                    {!draft.members.length && (
                      <div className="inline-relationships">
                        {(['spouse', 'child', 'parent'] as Relationship[]).map((relationship) => (
                          <button
                            className="button"
                            type="button"
                            key={relationship}
                            onClick={() => addMember(relationship)}
                          >
                            <Plus size={17} />
                            {t(relationshipLabels[relationship])}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {stage === 'documents' && (
              <DocumentUpload
                documents={draft.documents ?? []}
                onChange={(documents) =>
                  setDraft((current) => ({ ...current, documents, documentsConfirmed: false }))
                }
              />
            )}
            {stage === 'review' && (
              <>
                {draft.applicant.salaryBand === 'pending_4000' && (
                  <Hint className="warning-hint">
                    <strong>{t('Salary band to be confirmed')}</strong>
                    <br />
                    {t('We’ll keep this marked for confirmation.')}
                  </Hint>
                )}
                <ReviewContent draft={draft} onEdit={onNavigate} onEditMember={openMember} />
                <InquiryDocuments
                  record={{ id: '', draft, createdAt: '', documents: draft.documents }}
                  onEdit={() => onNavigate('documents', 0)}
                />
              </>
            )}
          </div>
          <div className="form-actions">
            <button type="button" className="button secondary back-button" onClick={back}>
              <ArrowLeft className="directional" size={19} />
              {t('Back')}
            </button>
            <div className="action-position">
              {stage === 'review' ? (
                <ShieldCheck size={16} />
              ) : (
                <span className="action-position-dot" />
              )}
              <span>{t(stageLabels[stage])}</span>
            </div>
            <PrimaryButton type="submit">
              {stage === 'family' && active && <CheckCircle weight="fill" size={21} />}
              {t(primaryLabel)}
            </PrimaryButton>
          </div>
        </form>
      </main>
      <Summary
        draft={draft}
        activeMemberId={stage === 'family' ? activeMemberId : null}
        onEdit={onNavigate}
        onEditMember={openMember}
        onChangeCoverage={onChangeCoverage}
      />
      <Modal title="Who would you like to add?" open={addOpen} onClose={() => setAddOpen(false)}>
        <p className="modal-description">{t('Choose their relationship to you.')}</p>
        <div className="relationship-options">
          {(['spouse', 'child', 'parent', ...(sponsor ? ['other'] : [])] as Relationship[]).map(
            (relationship) => {
              const spouseExists =
                relationship === 'spouse' &&
                draft.members.some((member) => member.relationship === 'spouse')
              return (
                <button
                  type="button"
                  key={relationship}
                  disabled={spouseExists}
                  onClick={() => addMember(relationship)}
                >
                  <span className="relationship-art" aria-hidden="true">
                    {relationship === 'parent' ? (
                      <>
                        <img src={art.father} alt="" />
                        <img src={art.mother} alt="" />
                      </>
                    ) : relationship === 'child' ? (
                      <>
                        <img src={art.boy} alt="" />
                        <img src={art.girl} alt="" />
                      </>
                    ) : relationship === 'spouse' ? (
                      <img src={art.woman} alt="" />
                    ) : (
                      <User size={30} />
                    )}
                  </span>
                  <span>
                    <strong>{t(relationshipLabels[relationship])}</strong>
                    {spouseExists && <small>{t('One spouse can be added to this inquiry.')}</small>}
                    {relationship === 'other' && (
                      <small>{t('Sponsored brother, sister or other family')}</small>
                    )}
                  </span>
                  <Plus size={20} />
                </button>
              )
            },
          )}
        </div>
      </Modal>
    </div>
  )
}
