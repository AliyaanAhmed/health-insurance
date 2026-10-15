import { useEffect, useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import { useLanguage } from './language-context'

/** Blob URLs exist only for the lifetime of the open preview. */
export function FilePreview({ file }: { file: File }) {
  const { t } = useLanguage()
  const [url, setUrl] = useState('')
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])
  const image =
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    /\.(png|jpe?g|webp)$/i.test(file.name)
  return (
    <div className="uploaded-file-preview">
      <div className="uploaded-preview-heading">
        <strong>{file.name}</strong>
        {url && (
          <a className="text-link" href={url} download={file.name}>
            <DownloadSimple size={16} />
            {t('Download')}
          </a>
        )}
      </div>
      {url &&
        (image ? (
          <img src={url} alt={file.name} />
        ) : (
          <>
            <iframe src={url} title={file.name} />
            <p>{t('If the preview is unavailable, download the document to open it.')}</p>
          </>
        ))}
    </div>
  )
}
