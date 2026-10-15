import { useEffect, useRef, useState } from 'react'
import { CalendarBlank, CaretLeft, CaretRight, X } from '@phosphor-icons/react'
import { useLanguage } from './language-context'
import { ageOf, todayISO } from './health'

type View = 'years' | 'months' | 'days'

export function DateCalendar({ value, onChange, name }: { value: string; onChange: (value: string) => void; name: string }) {
  const { t, locale } = useLanguage()
  const panel = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('days')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [page, setPage] = useState(Math.floor(new Date().getFullYear() / 12) * 12)
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLButtonElement>('.calendar-choices .selected:not(:disabled), .calendar-days .selected:not(:disabled), .calendar-choices button:not(:disabled), .calendar-days button:not(:disabled)')?.focus()
  }, [view, open])
  const today = todayISO()
  const currentYear = Number(today.slice(0, 4))
  const months = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat(locale, { month: 'short', calendar: 'gregory' }).format(new Date(2000, index, 1)))
  const iso = (day: number) => `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const date = (day: number) => {
    const result = new Date(0)
    result.setFullYear(year, month, day)
    result.setHours(12, 0, 0, 0)
    return result
  }
  const days = 32 - date(32).getDate()
  const offset = date(1).getDay()
  const close = () => { panel.current?.hidePopover(); trigger.current?.focus({ preventScroll: true }) }
  const choose = (day: number) => { onChange(iso(day)); close() }
  const move = (direction: number) => {
    if (view === 'years') setPage((current) => Math.max(1, Math.min(currentYear - 11, current + direction * 12)))
    else {
      const target = month + direction
      setMonth((target + 12) % 12)
      setYear(year + (target < 0 ? -1 : target > 11 ? 1 : 0))
    }
  }
  const show = () => {
    if (panel.current?.matches(':popover-open')) { close(); return }
    const initialYear = ageOf(value) !== null ? Number(value.slice(0, 4)) : currentYear
    setYear(initialYear)
    setMonth(ageOf(value) !== null ? Number(value.slice(5, 7)) - 1 : Number(today.slice(5, 7)) - 1)
    setPage(Math.max(1, Math.floor(initialYear / 12) * 12))
    setView('days')
    panel.current?.showPopover()
    const rect = trigger.current!.getBoundingClientRect()
    const width = Math.min(304, window.innerWidth - 24)
    Object.assign(panel.current!.style, {
      width: `${width}px`,
      left: `${Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12))}px`,
      top: `${Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - 370))}px`,
    })
    requestAnimationFrame(() => panel.current?.querySelector<HTMLButtonElement>('[data-initial-focus]')?.focus())
  }
  return <>
    <button ref={trigger} type="button" className="date-picker-button" aria-label={t('Choose date of birth')} aria-haspopup="dialog" aria-expanded={open} aria-controls={`${name}-calendar`} onClick={show}>
      <CalendarBlank size={20} />
    </button>
    <div ref={panel} id={`${name}-calendar`} className="health-calendar" popover="auto" role="dialog" aria-label={t('Choose date of birth')} onToggle={() => setOpen(Boolean(panel.current?.matches(':popover-open')))} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); close() } }}>
      <div className="calendar-heading"><strong>{t('Date of birth')}</strong><button type="button" className="calendar-close" onClick={close} aria-label={t('Close')}><X size={16} /></button></div>
      <div className="calendar-toolbar">
        <button type="button" className="calendar-nav" onClick={() => move(-1)} disabled={view === 'months' || (view === 'years' ? page <= 1 : year === 1 && month === 0)} aria-label={t('Previous')}><CaretLeft className="directional" /></button>
        <div className="calendar-period">
          {view === 'years' ? <strong aria-live="polite">{page} – {Math.min(page + 11, currentYear)}</strong> : <>
            <button type="button" onClick={() => setView('months')}>{months[month]}</button>
            <button type="button" onClick={() => { setPage(Math.max(1, Math.floor(year / 12) * 12)); setView('years') }}>{year}</button>
          </>}
        </div>
        <button type="button" className="calendar-nav" onClick={() => move(1)} disabled={view === 'months' || (view === 'years' ? page + 12 > currentYear : year === currentYear && month >= Number(today.slice(5, 7)) - 1)} aria-label={t('Next')}><CaretRight className="directional" /></button>
      </div>
      <p className="calendar-instruction">{t(view === 'years' ? 'Choose a year' : view === 'months' ? 'Choose a month' : 'Choose a day')}</p>
      {view === 'years' && <div className="calendar-choices" aria-label={t('Choose a year')}>
        {Array.from({ length: 12 }, (_, index) => page + index).map((item) => <button type="button" key={item} data-initial-focus={item === year ? '' : undefined} disabled={item > currentYear} className={item === year ? 'selected' : ''} onClick={() => { setYear(item); setView('months') }}>{item}</button>)}
      </div>}
      {view === 'months' && <div className="calendar-choices" aria-label={t('Choose a month')}>
        {months.map((label, index) => <button type="button" key={index} disabled={year === currentYear && index > Number(today.slice(5, 7)) - 1} className={index === month ? 'selected' : ''} onClick={() => { setMonth(index); setView('days') }}>{label}</button>)}
      </div>}
      {view === 'days' && <div className="calendar-days" aria-label={t('Choose a day')}>
        {Array.from({ length: 7 }, (_, index) => <span className="calendar-weekday" key={`week-${index}`}>{new Intl.DateTimeFormat(locale, { weekday: 'narrow', calendar: 'gregory' }).format(new Date(2023, 0, 1 + index))}</span>)}
        {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}
        {Array.from({ length: days }, (_, index) => index + 1).map((day) => <button type="button" key={day} data-day={day} data-initial-focus={(value || today) === iso(day) ? '' : undefined} aria-current={today === iso(day) ? 'date' : undefined} className={value === iso(day) ? 'selected' : today === iso(day) ? 'calendar-today' : ''} aria-pressed={value === iso(day)} aria-label={new Intl.DateTimeFormat(locale, { dateStyle: 'long', calendar: 'gregory' }).format(date(day))} disabled={iso(day) > today} onClick={() => choose(day)} onKeyDown={(event) => {
          const delta = event.key === 'ArrowDown' ? 7 : event.key === 'ArrowUp' ? -7 : event.key === 'ArrowRight' ? (locale === 'ar' ? -1 : 1) : event.key === 'ArrowLeft' ? (locale === 'ar' ? 1 : -1) : 0
          if (delta) { event.preventDefault(); panel.current?.querySelector<HTMLButtonElement>(`[data-day="${day + delta}"]:not(:disabled)`)?.focus() }
        }}>{day}</button>)}
      </div>}
      <div className="calendar-footer"><button type="button" onClick={() => { onChange(''); close() }}>{t('Clear date')}</button><span>{t('Day / month / year')}</span></div>
    </div>
  </>
}
