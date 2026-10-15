import { useState } from 'react'
import { Eye, FilePdf, FileImage, Files, Info, PencilSimple } from '@phosphor-icons/react'
import type { Inquiry, InquiryDocument } from './health'
import { useLanguage } from './language-context'
import { applicantRows, coverRows, DataRows } from './Summary'
import { Modal } from './ui'
import { FilePreview } from './FilePreview'

export function InquiryDocuments({ record, onEdit }: { record: Inquiry; onEdit?: () => void }) {
  const { t, locale } = useLanguage()
  const [selected, setSelected] = useState<InquiryDocument | null>(null)
  const documents = record.documents ?? []
  return (
    <section
      className="inquiry-detail-section detail-documents"
      aria-labelledby="inquiry-documents-heading"
    >
      <div className="detail-section-heading">
        <span>
          <Files size={21} />
        </span>
        <div>
          <h2 id="inquiry-documents-heading">{t('Documents')}</h2>
          <p>{t('Documents attached to this inquiry.')}</p>
        </div>
        <span className="documents-count">{documents.length}</span>
        {onEdit && (
          <button type="button" className="edit-button" onClick={onEdit}>
            <PencilSimple size={16} />
            {t('Edit')}
          </button>
        )}
      </div>
      {documents.length ? (
        <div className="inquiry-document-grid">
          {documents.map((document) => (
            <button
              className="inquiry-document"
              type="button"
              key={document.id}
              onClick={() => setSelected(document)}
              aria-label={`${t('Preview document')}: ${document.name}`}
            >
              <span className="document-file-icon">
                {document.file?.type.startsWith('image/') ? (
                  <FileImage size={25} />
                ) : (
                  <FilePdf size={25} />
                )}
              </span>
              <span className="document-file-copy">
                <strong>{document.name}</strong>
                <small>PDF{document.sample && <> · {t('Sample document')}</>}</small>
              </span>
              <Eye size={18} />
            </button>
          ))}
        </div>
      ) : (
        <div className="documents-empty">
          <Files size={27} weight="duotone" />
          <div>
            <strong>{t('No documents attached')}</strong>
            <p>{t('Documents will appear here once added to this inquiry.')}</p>
          </div>
        </div>
      )}
      <Modal
        title="Document preview"
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        className="inquiry-document-modal"
      >
        {selected?.file ? (
          <FilePreview file={selected.file} />
        ) : (
          selected && (
            <>
              <div className="document-preview-notice">
                <Info size={17} />
                <p>{t('This is an illustrative preview, not an uploaded file.')}</p>
              </div>
              <article className="sample-document-page">
                <p className="eyebrow">InsureAI Health</p>
                <h3>{selected.name.replace('.pdf', '').replaceAll('-', ' ')}</h3>
                <p className="document-preview-reference">{record.id}</p>
                <DataRows
                  rows={
                    selected.category === 'applicant'
                      ? applicantRows(record.draft, locale)
                      : selected.category === 'visa'
                        ? coverRows(record.draft, locale)
                        : [
                            [
                              'Cover details',
                              record.draft.members.map((member) => member.fullName).join(', '),
                            ],
                          ]
                  }
                />
              </article>
            </>
          )
        )}
      </Modal>
    </section>
  )
}
