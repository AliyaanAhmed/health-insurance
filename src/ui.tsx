import { useEffect, useRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import {
  ArrowRight,
  CheckCircle,
  Info,
  UserCircle,
  User,
  Baby,
  GenderMale,
  GenderFemale,
  X,
  WarningCircle,
} from '@phosphor-icons/react'
import { DateCalendar } from './DateCalendar'
import { ageOf, normalizeDigits } from './health'
import type { Gender, Person, Relationship } from './health'
import { useLanguage } from './language-context'

export function Avatar({
  person = {},
  relationship,
  size = 'normal',
}: {
  person?: Partial<Person>
  relationship?: Relationship
  size?: 'small' | 'normal' | 'large'
}) {
  const age = person.dateOfBirth ? ageOf(person.dateOfBirth) : null
  const Icon =
    relationship === 'child' || (age !== null && age < 18)
      ? Baby
      : person.gender
        ? User
        : UserCircle
  return (
    <span className={`avatar avatar-${size} person-icon-avatar`} aria-hidden="true">
      <Icon weight="regular" />
    </span>
  )
}

export function Status({ complete, editing = false }: { complete: boolean; editing?: boolean }) {
  const { t } = useLanguage()
  return (
    <span className={`status ${complete ? 'complete' : editing ? 'editing' : 'pending'}`}>
      {complete ? (
        <CheckCircle weight="fill" />
      ) : editing ? (
        <span className="status-bullet" />
      ) : (
        <Info />
      )}{' '}
      {t(complete ? 'Complete' : editing ? 'Editing' : 'Needs details')}
    </span>
  )
}
export function ErrorText({ error, id }: { error?: string; id: string }) {
  const { t } = useLanguage()
  return error ? (
    <span id={id} className="field-error">
      <WarningCircle weight="fill" />
      {t(error)}
    </span>
  ) : null
}
export function TextField({
  label,
  error,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const { t } = useLanguage()
  const id = props.id ?? props.name ?? label.toLowerCase().replace(/\W/g, '-')
  return (
    <div className="field" data-field={props.name ?? id}>
      <label htmlFor={id}>{t(label)}</label>
      <input
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
      {hint && (
        <span className="field-hint" id={`${id}-hint`}>
          {t(hint)}
        </span>
      )}
      <ErrorText id={`${id}-error`} error={error} />
    </div>
  )
}
export function DateField({
  value,
  onChange,
  error,
  name = 'dateOfBirth',
  onBlur,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
  name?: string
  onBlur?: () => void
}) {
  const { t } = useLanguage()
  const age = ageOf(value)
  const display = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : value
  const update = (raw: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      onChange(raw)
      return
    }
    const digits = normalizeDigits(raw).slice(0, 8)
    const formatted =
      digits.length > 4
        ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
        : digits.length > 2
          ? `${digits.slice(0, 2)}/${digits.slice(2)}`
          : digits
    onChange(
      digits.length === 8
        ? `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`
        : formatted,
    )
  }
  return (
    <div className="date-field" data-field={name}>
      <div className="field">
        <label htmlFor={name}>{t('Date of birth')}</label>
        <div className={`date-control ${error ? 'invalid' : ''}`}>
          <input
            id={name}
            name={name}
            type="text"
            inputMode="numeric"
            placeholder="DD / MM / YYYY"
            maxLength={10}
            value={display}
            onChange={(event) => update(event.target.value)}
            onBlur={onBlur}
            autoComplete="off"
            dir="ltr"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${name}-error` : `${name}-format`}
          />
          <DateCalendar value={value} onChange={onChange} name={name} />
        </div>
        <span id={`${name}-format`} className="field-hint">
          {t('Day / month / year')}
        </span>
        <ErrorText error={error} id={`${name}-error`} />
      </div>
      {age !== null && (
        <span className="age-tag">
          {age} {t('years old')}
        </span>
      )}
    </div>
  )
}
export interface ChoiceOption {
  value: string
  label: string
  helper?: string
  icon?: ReactNode
  image?: string
}
export function ChoiceGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
  className = '',
  compact = false,
}: {
  name: string
  label: string
  options: ChoiceOption[]
  value: string
  onChange: (value: string) => void
  error?: string
  className?: string
  compact?: boolean
}) {
  const { t } = useLanguage()
  return (
    <fieldset
      className={`choice-field ${className}`}
      data-field={name}
      aria-describedby={error ? `${name}-error` : undefined}
      aria-invalid={Boolean(error)}
    >
      <legend>{t(label)}</legend>
      <div className={`choice-options ${compact ? 'compact' : ''}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`option ${value === option.value ? 'selected' : ''} ${option.image ? 'illustrated-option' : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.image && (
              <span className="option-portrait">
                <img src={option.image} alt="" />
              </span>
            )}
            {option.icon && <span className="option-icon">{option.icon}</span>}
            <span className="option-copy">
              <strong>{t(option.label)}</strong>
              {option.helper && <span>{t(option.helper)}</span>}
            </span>
          </label>
        ))}
      </div>
      <ErrorText error={error} id={`${name}-error`} />
    </fieldset>
  )
}
export function GenderGroup({
  value,
  onChange,
  error,
  name = 'gender',
}: {
  value: Gender
  onChange: (value: Gender) => void
  error?: string
  name?: string
  child?: boolean
  relationship?: Relationship
  dateOfBirth?: string
}) {
  return (
    <ChoiceGroup
      name={name}
      label="Gender"
      className="gender-field"
      options={[
        { value: 'male', label: 'Male', icon: <GenderMale size={24} /> },
        { value: 'female', label: 'Female', icon: <GenderFemale size={24} /> },
      ]}
      value={value}
      onChange={(value) => onChange(value as Gender)}
      error={error}
    />
  )
}
export function Hint({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`hint ${className}`}>
      <Info size={19} />
      <div>{children}</div>
    </div>
  )
}
export function Modal({
  open,
  onClose,
  title,
  children,
  className = '',
  dismissible = true,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
  dismissible?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const { t } = useLanguage()
  useEffect(() => {
    if (!open || !ref.current) return
    const previous = document.activeElement as HTMLElement | null
    const fallback = previous
      ?.closest('.personal-inquiry-card')
      ?.querySelector<HTMLElement>('.request-card-open')
    const dialog = ref.current
    dialog.showModal()
    return () => {
      dialog.close()
      if (previous?.isConnected) previous.focus()
      else fallback?.focus()
    }
  }, [open])
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      onCancel={(event) => {
        event.preventDefault()
        if (dismissible) onClose()
      }}
      onClick={(event) => {
        if (dismissible && event.target === ref.current) onClose()
      }}
      aria-labelledby={`${title.replace(/\W/g, '')}-title`}
    >
      <div className="modal-header">
        <h2 id={`${title.replace(/\W/g, '')}-title`}>{t(title)}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={t('Close')}
          type="button"
          disabled={!dismissible}
        >
          <X size={20} />
        </button>
      </div>
      {open && children}
    </dialog>
  )
}
export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  busy = false,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  busy?: boolean
}) {
  return (
    <button
      type={type}
      className="button primary"
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
    >
      {children}
      <ArrowRight className="directional" size={19} />
    </button>
  )
}
