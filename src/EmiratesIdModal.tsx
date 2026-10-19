import { useEffect, useRef, useState } from 'react'
import {
  CheckCircle,
  File,
  IdentificationCard,
  SpinnerGap,
  Trash,
  UploadSimple,
  WarningCircle,
} from '@phosphor-icons/react'
import type { Inquiry } from './health'
import { Modal } from './ui'
import { useLanguage } from './language-context'
import { FilePreview } from './FilePreview'
import { fileSize } from './DocumentUpload'
import idIllustration from './assets/Emirates ID.png'
import alternateIdIllustration from './assets/EMIRATESID(2).png'
import {
  finishEmiratesUpload,
  FOLLOW_UP_STATUS,
  getHealthRequest,
  identityFileError,
  MAX_ID_FILES,
  uploadEmiratesFile,
} from './powerPagesApi'

type UploadItem = {
  id: string
  file: File
  state: 'selected' | 'uploading' | 'uploaded' | 'failed'
  error?: string
}
export function EmiratesIdModal({
  record,
  onClose,
  onUpdated,
}: {
  record?: Inquiry
  onClose: () => void
  onUpdated: (record: Inquiry) => void
}) {
  const { t } = useLanguage()
  const queues = useRef<Record<string, UploadItem[]>>({})
  const [, rerender] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const scrollArea = useRef<HTMLDivElement>(null)
  const fileList = useRef<HTMLDivElement>(null)
  const [revealFileId, setRevealFileId] = useState<string | null>(null)
  const inFlight = useRef(false)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [stage, setStage] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const files = record ? (queues.current[record.id] ?? []) : []
  const uploaded = files.filter((item) => item.state === 'uploaded').length
  const preview = files.find((item) => item.id === previewId)
  useEffect(() => {
    if (!revealFileId) return
    const frame = requestAnimationFrame(() => {
      const container = scrollArea.current
      const row = fileList.current?.querySelector<HTMLElement>(
        `[data-file-id="${revealFileId}"]`,
      )
      if (!container || !row) return
      const viewport = container.getBoundingClientRect()
      const bounds = row.getBoundingClientRect()
      const distance =
        bounds.bottom > viewport.bottom - 16
          ? bounds.bottom - viewport.bottom + 16
          : bounds.top < viewport.top + 16
            ? bounds.top - viewport.top - 16
            : 0
      if (distance)
        container.scrollBy({
          top: distance,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
        })
    })
    return () => cancelAnimationFrame(frame)
  }, [revealFileId])
  const update = (id: string, next: UploadItem[]) => {
    queues.current[id] = next
    rerender((value) => value + 1)
  }
  const close = () => {
    if (!inFlight.current) {
      setError('')
      setStage('')
      setPreviewId(null)
      onClose()
    }
  }
  const add = (list: File[]) => {
    if (!record || inFlight.current) return
    const next = [...(queues.current[record.id] ?? [])]
    const previousCount = next.length
    const errors: string[] = []
    for (const file of list) {
      const validation = identityFileError(file)
      const duplicate = next.some(
        (item) =>
          item.file.name === file.name &&
          item.file.size === file.size &&
          item.file.lastModified === file.lastModified,
      )
      if (validation) errors.push(file.name + ': ' + t(validation))
      else if (duplicate) errors.push(file.name + ': ' + t('This file has already been added.'))
      else if (next.length >= MAX_ID_FILES) errors.push(t('You can add up to 10 files.'))
      else next.push({ id: crypto.randomUUID(), file, state: 'selected' })
    }
    update(record.id, next)
    if (next.length > previousCount) setRevealFileId(next[next.length - 1].id)
    setError(errors.join('\n'))
    if (input.current) input.current.value = ''
  }
  const upload = async () => {
    if (!record || inFlight.current || !files.length) return
    inFlight.current = true
    setBusy(true)
    setError('')
    setPreviewId(null)
    const id = record.id
    let working = [...files]
    try {
      setStage('Checking your request')
      const latest = await getHealthRequest(id)
      if (latest.dataverseStatus === FOLLOW_UP_STATUS.ipcVerification) {
        delete queues.current[id]
        onUpdated(latest)
        closeAfterSuccess()
        return
      }
      if (latest.dataverseStatus !== FOLLOW_UP_STATUS.emiratesIdRequired) {
        onUpdated(latest)
        throw new Error(
          t('This request no longer needs Emirates ID documents. Refresh your requests.'),
        )
      }
      for (let index = 0; index < working.length; index++) {
        if (working[index].state === 'uploaded') continue
        setStage(t('Uploading file') + ' ' + (index + 1) + ' / ' + working.length)
        working = working.map((item, i) =>
          i === index ? { ...item, state: 'uploading', error: '' } : item,
        )
        update(id, working)
        try {
          await uploadEmiratesFile(id, working[index].file)
          working = working.map((item, i) => (i === index ? { ...item, state: 'uploaded' } : item))
          update(id, working)
        } catch (failure) {
          const message =
            failure instanceof Error ? failure.message : t('This upload could not be confirmed.')
          working = working.map((item, i) =>
            i === index ? { ...item, state: 'failed', error: message } : item,
          )
          update(id, working)
          throw failure
        }
      }
      setStage('Finishing verification')
      const updated = await finishEmiratesUpload(id)
      onUpdated(updated)
      delete queues.current[id]
      closeAfterSuccess()
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : t('Your documents could not be submitted.'),
      )
    } finally {
      inFlight.current = false
      setBusy(false)
      setStage('')
    }
  }
  const closeAfterSuccess = () => {
    setPreviewId(null)
    setError('')
    onClose()
  }
  return (
    <Modal
      title="Upload Emirates ID"
      open={Boolean(record)}
      onClose={close}
      dismissible={!busy}
      className="followup-dialog identity-dialog"
    >
      <div className="followup-scroll" ref={scrollArea}>
        <div className="followup-intro">
          <span className="followup-icon">
            <IdentificationCard size={25} />
          </span>
          <div>
            <h3>{t('A clear copy, a simple next step.')}</h3>
            <p>
              {t('Add Emirates ID documents for the people in this request.')}
            </p>
          </div>
        </div>
        <div className="identity-examples" aria-hidden="true">
          {[idIllustration, alternateIdIllustration].map((src) => (
            <figure key={src}>
              <img src={src} alt="" width="1132" height="562" />
            </figure>
          ))}
        </div>
        <div
          className={`identity-dropzone ${dragging ? 'is-dragging' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            if (!busy) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            add(Array.from(event.dataTransfer.files))
          }}
        >
          <UploadSimple size={26} aria-hidden="true" />
          <strong>{t('Drop your ID copies here')}</strong>
          <span>{t('PDF, JPG, PNG or WEBP · 10 MB per file · up to 10 files')}</span>
          <button
            className="button secondary"
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {t('Browse files')}
          </button>
          <input
            ref={input}
            type="file"
            hidden
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            disabled={busy}
            aria-label={t('Choose Emirates ID files')}
            onChange={(event) => add(Array.from(event.target.files ?? []))}
          />
        </div>
        {files.length > 0 && (
          <div className="identity-file-list" ref={fileList}>
            {files.map((item) => (
              <div className={`identity-file ${item.state}`} key={item.id} data-file-id={item.id}>
                <span className="identity-file-icon">
                  {item.state === 'uploaded' ? (
                    <CheckCircle size={23} weight="fill" />
                  ) : item.state === 'uploading' ? (
                    <SpinnerGap className="integration-spinner" size={23} />
                  ) : (
                    <File size={23} />
                  )}
                </span>
                <div>
                  <button
                    type="button"
                    className="identity-file-name"
                    disabled={busy}
                    onClick={() => setPreviewId(previewId === item.id ? null : item.id)}
                  >
                    {item.file.name}
                  </button>
                  <small>
                    {fileSize(item.file.size)} ·{' '}
                    {t(
                      item.state === 'uploaded'
                        ? 'Uploaded'
                        : item.state === 'uploading'
                          ? 'Uploading'
                          : item.state === 'failed'
                            ? 'Not confirmed'
                            : 'Ready to upload',
                    )}
                  </small>
                  {item.error && <p className="followup-error-copy">{item.error}</p>}
                </div>
                {item.state !== 'uploaded' && (
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={t('Remove') + ' ' + item.file.name}
                    disabled={busy}
                    onClick={() =>
                      record &&
                      update(
                        record.id,
                        files.filter((file) => file.id !== item.id),
                      )
                    }
                  >
                    <Trash size={17} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {preview && (
          <div className="identity-preview">
            <FilePreview file={preview.file} />
          </div>
        )}
        {files.length > 0 && (
          <div className="identity-progress">
            <div>
              <span>
                {uploaded} / {files.length} {t('files uploaded')}
              </span>
              {busy && <span role="status">{t(stage)}</span>}
            </div>
            <progress max={files.length} value={uploaded} aria-label={t('Files uploaded')} />
          </div>
        )}
        {error && (
          <div className="followup-error" role="alert">
            <WarningCircle size={18} />
            <p>{error}</p>
          </div>
        )}
        <p className="followup-note">
          {t(
            'Confirmed files are kept. If a connection drops, check any unconfirmed file before retrying to avoid uploading it twice.',
          )}
        </p>
      </div>
      <div className="followup-footer">
        <button type="button" className="button secondary" disabled={busy} onClick={close}>
          {t('Close')}
        </button>
        <button
          type="button"
          className="button primary"
          disabled={
            busy || !files.length || record?.dataverseStatus !== FOLLOW_UP_STATUS.emiratesIdRequired
          }
          aria-busy={busy}
          onClick={() => void upload()}
        >
          {busy ? (
            <SpinnerGap size={19} className="integration-spinner" />
          ) : (
            <UploadSimple size={18} />
          )}
          {t(
            busy
              ? 'Uploading documents'
              : uploaded === files.length && files.length
                ? 'Finish verification'
                : files.some((item) => item.state === 'failed')
                  ? 'Retry unconfirmed files'
                  : 'Upload documents',
          )}
        </button>
      </div>
    </Modal>
  )
}
