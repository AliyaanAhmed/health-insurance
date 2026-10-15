import { useEffect, useRef, useState } from 'react'
import { ArrowRight, DeviceMobile, Info } from '@phosphor-icons/react'
import { formatMobile, normalizeDigits } from './health'
import { useLanguage } from './language-context'
import { Modal } from './ui'

export function Verification({
  open,
  mobile,
  onClose,
  onEditMobile,
  onVerified,
}: {
  open: boolean
  mobile: string
  onClose: () => void
  onEditMobile: () => void
  onVerified: () => void
}) {
  const { t } = useLanguage()
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [countdown, setCountdown] = useState(30)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resent, setResent] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const busyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const frame = requestAnimationFrame(() => inputs.current[0]?.focus())
    return () => {
      cancelAnimationFrame(frame)
      if (busyTimer.current) clearTimeout(busyTimer.current)
    }
  }, [])
  useEffect(() => {
    if (!open || countdown <= 0) return
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, open])
  const putDigits = (index: number, value: string) => {
    const clean = normalizeDigits(value)
    setError('')
    setDigits((current) => {
      const next = [...current]
      if (!clean) next[index] = ''
      else
        clean
          .slice(0, 6 - index)
          .split('')
          .forEach((digit, i) => {
            next[index + i] = digit
          })
      return next
    })
    inputs.current[Math.min(5, index + clean.length)]?.focus()
  }
  const submit = () => {
    if (digits.join('').length !== 6) {
      setError('Enter all six digits.')
      inputs.current[digits.findIndex((digit) => !digit)]?.focus()
      return
    }
    if (digits.join('') !== '123456') {
      setError('Use the demo code 123456.')
      inputs.current[0]?.focus()
      return
    }
    setBusy(true)
    busyTimer.current = setTimeout(() => {
      onVerified()
      setBusy(false)
    }, 450)
  }
  return (
    <Modal
      title="Verify your mobile"
      open={open}
      onClose={() => {
        if (!busy) onClose()
      }}
      className="verification-modal"
    >
      <div className="verification-icon">
        <DeviceMobile size={31} weight="duotone" />
      </div>
      <h3>{t('Enter the 6-digit code')}</h3>
      <p className="verification-number" dir="ltr">
        {formatMobile(mobile, true)}
      </p>
      <button type="button" className="text-link" onClick={onEditMobile} disabled={busy}>
        {t('Change mobile number')}
      </button>
      <div className="demo-verification">
        <Info size={18} />
        <span>
          <strong>{t('Demo verification')}</strong>
          {t('Use 123456 to explore this preview. No SMS will be sent.')}
        </span>
      </div>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <div className="otp-inputs" dir="ltr" role="group" aria-label={t('Enter the 6-digit code')}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                inputs.current[index] = node
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              aria-label={`OTP ${index + 1}`}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'otp-error' : undefined}
              value={digit}
              maxLength={6}
              disabled={busy}
              onChange={(event) => putDigits(index, event.target.value)}
              onPaste={(event) => {
                event.preventDefault()
                putDigits(index, event.clipboardData.getData('text'))
              }}
              onKeyDown={(event) => {
                if (event.key === 'Backspace' && !digit && index > 0)
                  inputs.current[index - 1]?.focus()
                else if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus()
                else if (event.key === 'ArrowRight' && index < 5) inputs.current[index + 1]?.focus()
              }}
            />
          ))}
        </div>
        {error && (
          <p className="field-error" id="otp-error" role="alert">
            {t(error)}
          </p>
        )}
        <button
          type="submit"
          className="button primary verification-submit"
          disabled={busy}
          aria-busy={busy}
        >
          {t(busy ? 'Verifying…' : 'Verify & finish preview')}
          <ArrowRight className="directional" />
        </button>
      </form>
      <div className="resend-row">
        <button
          type="button"
          disabled={countdown > 0 || busy}
          onClick={() => {
            setCountdown(30)
            setResent(true)
            setError('')
            inputs.current[0]?.focus()
          }}
        >
          {countdown ? `${t('Resend in')} ${countdown}s` : t('Resend code')}
        </button>
        <span role="status">{resent ? t('Code ready. Use 123456.') : ''}</span>
      </div>
    </Modal>
  )
}
