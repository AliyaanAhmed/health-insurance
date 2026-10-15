import { useRef, useState } from 'react'
import {
  CheckCircle,
  Eye,
  FileImage,
  FilePdf,
  Info,
  Trash,
  UploadSimple,
  WarningCircle,
} from '@phosphor-icons/react'
import emiratesId from './assets/Stylized Emirates ID upload card-2.png'
import passportVisa from './assets/Passport Visa Upload Illustration-1.png'
import type { InquiryDocument } from './health'
import { useLanguage } from './language-context'
import { Modal } from './ui'
import { FilePreview } from './FilePreview'

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
const MAX_FILES = 10
export function fileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
export function DocumentUpload({
  documents,
  onChange,
}: {
  documents: InquiryDocument[]
  onChange: (documents: InquiryDocument[]) => void
}) {
  const { t } = useLanguage()
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [errors, setErrors] = useState<{ name: string; message: string }[]>([])
  const [selected, setSelected] = useState<InquiryDocument | null>(null)
  const add = (files: File[]) => {
    const accepted = [...documents]
    const rejected: { name: string; message: string }[] = []
    for (const file of files) {
      const allowed =
        /\.(pdf|png|jpe?g|webp)$/i.test(file.name) &&
        (!file.type ||
          ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      const duplicate = accepted.some(
        (document) =>
          document.file &&
          document.file.name === file.name &&
          document.file.size === file.size &&
          document.file.lastModified === file.lastModified,
      )
      const message = !allowed
        ? 'Use a PDF, JPG, PNG or WEBP file.'
        : file.size === 0
          ? 'This file is empty. Choose another file.'
          : file.size > MAX_DOCUMENT_BYTES
            ? 'This file is larger than 10 MB.'
            : duplicate
              ? 'This file has already been added.'
              : accepted.length >= MAX_FILES
                ? 'You can add up to 10 files.'
                : ''
      if (message) rejected.push({ name: file.name, message })
      else accepted.push({ id: crypto.randomUUID(), name: file.name, category: 'applicant', file })
    }
    setErrors(rejected)
    if (accepted.length !== documents.length) onChange(accepted)
    if (input.current) input.current.value = ''
  }
  return (
    <div className="document-upload">
      <div className="upload-reference-grid">
        {[
          { image: emiratesId, title: 'Emirates ID', body: 'Front and back, if available' },
          {
            image: passportVisa,
            title: 'Passport & residence visa',
            body: 'Passport identity page and visa copy',
          },
        ].map((item) => (
          <div className="upload-reference" key={item.title}>
            <div>
              <img src={item.image} alt="" />
            </div>
            <strong>{t(item.title)}</strong>
            <p>{t(item.body)}</p>
          </div>
        ))}
      </div>
      <div
        className={`document-dropzone ${dragging ? 'is-dragging' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          event.dataTransfer.dropEffect = 'copy'
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          add(Array.from(event.dataTransfer.files))
        }}
      >
        <span className="upload-cloud-icon">
          <UploadSimple size={27} />
        </span>
        <h2>{t(dragging ? 'Drop your documents here' : 'Choose files or drag them here')}</h2>
        <p>{t('PDF, JPG, PNG or WEBP. Up to 10 MB per file, 10 files maximum.')}</p>
        <button type="button" className="button secondary" onClick={() => input.current?.click()}>
          {t('Browse files')}
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="sr-only"
          aria-label={t('Choose documents')}
          onChange={(event) => add(Array.from(event.target.files ?? []))}
        />
      </div>
      {errors.length > 0 && (
        <div className="upload-errors" role="alert">
          {errors.map((error, index) => (
            <p key={index}>
              <WarningCircle size={16} />
              <span>
                <strong>{error.name}</strong> {t(error.message)}
              </span>
            </p>
          ))}
        </div>
      )}
      {documents.length > 0 && (
        <div className="upload-file-list">
          <div className="upload-list-title">
            <strong>{t('Added documents')}</strong>
            <span>
              {documents.length} / {MAX_FILES}
            </span>
          </div>
          {documents.map((document) => (
            <div className="upload-file-row" key={document.id}>
              <span className="upload-file-icon">
                {document.file?.type.startsWith('image/') ? (
                  <FileImage size={23} />
                ) : (
                  <FilePdf size={23} />
                )}
              </span>
              <div className="upload-file-copy">
                <strong>{document.name}</strong>
                <span>
                  {document.file ? fileSize(document.file.size) : ''}
                  <CheckCircle size={12} weight="fill" />
                  {t('Added')}
                </span>
              </div>
              <button
                type="button"
                className="upload-file-action"
                onClick={() => setSelected(document)}
                aria-label={`${t('Preview document')}: ${document.name}`}
              >
                <Eye size={18} />
              </button>
              <button
                type="button"
                className="upload-file-action remove-file"
                onClick={() => {
                  onChange(documents.filter((item) => item.id !== document.id))
                  setErrors([])
                }}
                aria-label={`${t('Remove document')}: ${document.name}`}
              >
                <Trash size={17} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="upload-information">
        <Info size={17} />
        <p>
          {t('Add documents you have available. You can continue without documents for now.')}
          <span>{t('Files stay in this browser session and are cleared on refresh.')}</span>
        </p>
      </div>
      <Modal
        title="Document preview"
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        className="inquiry-document-modal"
      >
        {selected?.file && <FilePreview file={selected.file} />}
      </Modal>
    </div>
  )
}
