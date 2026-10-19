import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { CaretDown, Check, MagnifyingGlass, X } from '@phosphor-icons/react'
import { useLanguage } from './language-context'
import './CustomSelect.css'

export interface SelectOption {
  value: string
  label: string
  helper?: string
  keywords?: string
}
export function CustomSelect({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select',
  searchable = false,
  searchLabel = 'Search options',
  emptyLabel = 'No matching options',
  icon,
  error,
  errorId,
  compact = false,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label: string
  placeholder?: string
  searchable?: boolean
  searchLabel?: string
  emptyLabel?: string
  icon?: ReactNode
  error?: string
  errorId?: string
  compact?: boolean
}) {
  const { t, locale } = useLanguage()
  const id = useId()
  const panel = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const search = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const typeahead = useRef({ text: '', at: 0 })
  const selected = options.find((option) => option.value === value)
  const filtered = options.filter((option) =>
    `${t(option.label)} ${option.label} ${option.keywords ?? ''}`
      .toLocaleLowerCase(locale)
      .includes(query.trim().toLocaleLowerCase(locale)),
  )
  const position = () => {
    if (!panel.current || !trigger.current) return
    const rect = trigger.current.getBoundingClientRect()
    const width = Math.min(Math.max(rect.width, compact ? 250 : 280), window.innerWidth - 24)
    const below = window.innerHeight - rect.bottom - 12
    const above = rect.top - 12
    const up = below < 240 && above > below
    const maxHeight = Math.min(355, up ? above - 8 : below - 8)
    Object.assign(panel.current.style, {
      width: `${width}px`,
      left: `${Math.max(12, Math.min(locale === 'ar' ? rect.right - width : rect.left, window.innerWidth - width - 12))}px`,
      top: up ? 'auto' : `${rect.bottom + 8}px`,
      bottom: up ? `${window.innerHeight - rect.top + 8}px` : 'auto',
      maxHeight: `${Math.max(100, maxHeight)}px`,
    })
  }
  const close = (restore = true) => {
    panel.current?.hidePopover()
    if (restore) trigger.current?.focus({ preventScroll: true })
  }
  const show = (fromEnd = false) => {
    setQuery('')
    const index = options.findIndex((option) => option.value === value)
    setActive(index >= 0 ? index : fromEnd ? options.length - 1 : 0)
    panel.current?.showPopover()
    position()
  }
  const choose = (option: SelectOption) => {
    close()
    onChange(option.value)
  }
  const keys = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close()
      return
    }
    if (event.key === 'Tab') {
      close(false)
      return
    }
    let next = active
    if (event.key === 'ArrowDown') next = Math.min(filtered.length - 1, active + 1)
    else if (event.key === 'ArrowUp') next = Math.max(0, active - 1)
    else if (event.key === 'Home' && event.target !== search.current) next = 0
    else if (event.key === 'End' && event.target !== search.current) next = filtered.length - 1
    else if (event.key === 'Enter' || (event.key === ' ' && !searchable)) {
      event.preventDefault()
      if (filtered[active]) choose(filtered[active])
      return
    } else {
      if (
        !searchable &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        const now = Date.now()
        typeahead.current.text =
          (now - typeahead.current.at > 600 ? '' : typeahead.current.text) +
          event.key.toLocaleLowerCase(locale)
        typeahead.current.at = now
        const match = filtered.findIndex((option) =>
          t(option.label).toLocaleLowerCase(locale).startsWith(typeahead.current.text),
        )
        if (match >= 0) {
          event.preventDefault()
          setActive(match)
        }
      }
      return
    }
    event.preventDefault()
    setActive(next)
  }
  useEffect(() => {
    if (!open) return
    if (searchable) search.current?.focus({ preventScroll: true })
    else list.current?.focus({ preventScroll: true })
    const update = () => position()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, locale, searchable])
  useEffect(() => {
    if (open)
      document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open, id, query])
  return (
    <div className={`custom-select ${compact ? 'custom-select-compact' : ''}`}>
      <button
        ref={trigger}
        type="button"
        className={`custom-select-trigger ${open ? 'is-open' : ''} ${error ? 'is-invalid' : ''}`}
        aria-label={t(label)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onClick={() => (open ? close() : show())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            show(event.key === 'ArrowUp')
          }
        }}
      >
        {icon && <span className="custom-select-icon">{icon}</span>}
        <span className={selected ? '' : 'select-placeholder'}>
          {selected ? t(selected.label) : t(placeholder)}
        </span>
        <CaretDown size={15} className="custom-select-chevron" />
      </button>
      <div
        ref={panel}
        popover="auto"
        className="custom-select-panel"
        onToggle={() => setOpen(Boolean(panel.current?.matches(':popover-open')))}
        onKeyDown={keys}
      >
        {searchable && (
          <div className="custom-select-search">
            <MagnifyingGlass size={17} />
            <input
              ref={search}
              type="text"
              role="combobox"
              aria-label={t(searchLabel)}
              aria-expanded={open}
              aria-controls={`${id}-list`}
              aria-activedescendant={filtered[active] ? `${id}-option-${active}` : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              value={query}
              placeholder={t(searchLabel)}
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
              }}
            />
            {query && (
              <button
                type="button"
                tabIndex={-1}
                aria-label={t('Clear search')}
                onClick={() => {
                  setQuery('')
                  setActive(0)
                  search.current?.focus()
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
        <div
          ref={list}
          id={`${id}-list`}
          role="listbox"
          aria-label={t(label)}
          tabIndex={searchable ? -1 : 0}
          aria-activedescendant={filtered[active] ? `${id}-option-${active}` : undefined}
          className="custom-select-options"
        >
          {filtered.map((option, index) => (
            <div
              role="option"
              id={`${id}-option-${index}`}
              aria-selected={option.value === value}
              className={`custom-select-option ${active === index ? 'is-active' : ''} ${value === option.value ? 'is-selected' : ''}`}
              key={option.value}
              onMouseEnter={() => setActive(index)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
            >
              <span>
                <strong>{t(option.label)}</strong>
                {option.helper && <small>{t(option.helper)}</small>}
              </span>
              {option.value === value && <Check size={16} weight="bold" />}
            </div>
          ))}
        </div>
        {!filtered.length && (
          <p className="custom-select-empty" role="status">
            {t(emptyLabel)}
          </p>
        )}
      </div>
    </div>
  )
}
