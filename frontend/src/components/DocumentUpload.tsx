import { useRef, useState } from 'react'
import { uploadDocument } from '../api/documindClient'
import type { UploadDocumentResponse } from '../types/api'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface DocumentUploadProps {
  /** Called with the returned documentId once upload succeeds */
  onUploadSuccess: (documentId: string, fileName: string) => void
}

// ---------------------------------------------------------------------------
// Local state shape
// ---------------------------------------------------------------------------
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [result, setResult] = useState<UploadDocumentResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setStatus('idle')
    setResult(null)
    setErrorMessage(null)
  }

  async function handleUpload() {
    if (!selectedFile) return

    setStatus('uploading')
    setErrorMessage(null)
    setResult(null)

    try {
      const response = await uploadDocument(selectedFile)
      setResult(response)
      setStatus('success')
      onUploadSuccess(response.documentId, response.fileName)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed.')
      setStatus('error')
    }
  }

  function handleReset() {
    setSelectedFile(null)
    setStatus('idle')
    setResult(null)
    setErrorMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // -------------------------------------------------------------------------
  // Derived helpers
  // -------------------------------------------------------------------------
  const isUploading = status === 'uploading'
  const fileSizeMB = selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : null

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>Upload a Document</h2>
      <p style={styles.subtext}>Supported formats: PDF, TXT · Max size: 10 MB</p>

      {/* File picker */}
      <div style={styles.inputRow}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileChange}
          disabled={isUploading}
          style={styles.fileInput}
        />
        {selectedFile && (
          <span style={styles.fileMeta}>
            {selectedFile.name} ({fileSizeMB} MB)
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div style={styles.buttonRow}>
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          style={{
            ...styles.button,
            ...styles.primaryButton,
            opacity: !selectedFile || isUploading ? 0.5 : 1,
            cursor: !selectedFile || isUploading ? 'not-allowed' : 'pointer',
          }}
        >
          {isUploading ? 'Uploading…' : 'Upload'}
        </button>

        {status !== 'idle' && (
          <button onClick={handleReset} style={{ ...styles.button, ...styles.secondaryButton }}>
            Reset
          </button>
        )}
      </div>

      {/* Success feedback */}
      {status === 'success' && result && (
        <div style={{ ...styles.feedback, ...styles.successBox }}>
          <strong>Upload successful!</strong>
          <ul style={styles.metaList}>
            <li>Document ID: <code>{result.documentId}</code></li>
            <li>File: {result.fileName}</li>
            <li>Chunks indexed: {result.chunkCount}</li>
          </ul>
          <p style={styles.hint}>You can now ask questions about this document.</p>
        </div>
      )}

      {/* Error feedback */}
      {status === 'error' && errorMessage && (
        <div style={{ ...styles.feedback, ...styles.errorBox }}>
          <strong>Upload failed:</strong> {errorMessage}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline styles — no external CSS dependency required to run locally
// ---------------------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  card: {
    maxWidth: 520,
    margin: '40px auto',
    padding: '32px',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    fontFamily: 'system-ui, sans-serif',
    backgroundColor: '#fff',
  },
  heading: {
    margin: '0 0 4px',
    fontSize: 22,
    color: '#1a202c',
  },
  subtext: {
    margin: '0 0 24px',
    fontSize: 14,
    color: '#718096',
  },
  inputRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 20,
  },
  fileInput: {
    fontSize: 14,
  },
  fileMeta: {
    fontSize: 13,
    color: '#4a5568',
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    padding: '10px 20px',
    borderRadius: 8,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    transition: 'opacity 0.15s',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
    color: '#4a5568',
    cursor: 'pointer',
  },
  feedback: {
    padding: '16px',
    borderRadius: 8,
    fontSize: 14,
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #86efac',
    color: '#166534',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#991b1b',
  },
  metaList: {
    margin: '8px 0',
    paddingLeft: 20,
    lineHeight: 1.8,
  },
  hint: {
    margin: '8px 0 0',
    color: '#15803d',
  },
}
