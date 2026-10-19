import { useRef, useState } from 'react'
import { ArrowUpRight, User } from '@phosphor-icons/react'
import { useLanguage } from './language-context'

export const previewAccount = {
  name: 'Mohammed Al Mansoori',
  email: 'mohammed.al.mansoori@example.com',
}
export function AccountMenu() {
  const { t, locale } = useLanguage()
  const panel = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const toggle = () => {
    if (open) {
      panel.current?.hidePopover()
      return
    }
    panel.current?.showPopover()
    const rect = trigger.current!.getBoundingClientRect()
    const width = Math.min(290, window.innerWidth - 24)
    Object.assign(panel.current!.style, {
      width: width + 'px',
      left:
        Math.max(
          12,
          Math.min(
            locale === 'ar' ? rect.left : rect.right - width,
            window.innerWidth - width - 12,
          ),
        ) + 'px',
      top: rect.bottom + 10 + 'px',
    })
  }
  return (
    <div className="account-menu">
      <button
        ref={trigger}
        type="button"
        className="account-trigger"
        aria-label={t('Your account')}
        aria-expanded={open}
        aria-controls="account-popover"
        onClick={toggle}
      >
        <User size={21} />
      </button>
      <div
        id="account-popover"
        ref={panel}
        popover="auto"
        className="account-popover"
        onToggle={() => setOpen(Boolean(panel.current?.matches(':popover-open')))}
      >
        <strong>{previewAccount.name}</strong>
        <span dir="ltr">{previewAccount.email}</span>
        <a href="#/inquiries" onClick={() => panel.current?.hidePopover()}>
          {t('My Requests')}
          <ArrowUpRight size={16} className="directional" />
        </a>
      </div>
    </div>
  )
}
