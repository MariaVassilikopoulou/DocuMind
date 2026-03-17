import { useState } from 'react'
import { ChatInterface } from './components/ChatInterface'
import { DocumentUpload } from './components/DocumentUpload'

function App() {
  const [activeDocument, setActiveDocument] = useState<{
    documentId: string
    fileName: string
  } | null>(null)

  function handleUploadSuccess(documentId: string, fileName: string) {
    setActiveDocument({ documentId, fileName })
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px 16px 48px' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1e293b', margin: 0 }}>
          DocuMind
        </h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 16 }}>
          Upload a document and ask questions about it
        </p>
      </header>

      {/* Step 1 — upload; collapses visually once a document is active */}
      {!activeDocument ? (
        <DocumentUpload onUploadSuccess={handleUploadSuccess} />
      ) : (
        <div
          style={{
            maxWidth: 680,
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderRadius: 10,
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 13,
            color: '#166534',
          }}
        >
          <span>
            <strong>{activeDocument.fileName}</strong> uploaded successfully.
          </span>
          <button
            onClick={() => setActiveDocument(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#15803d',
              fontWeight: 600,
              fontSize: 13,
              padding: '2px 6px',
            }}
          >
            ✕ Change document
          </button>
        </div>
      )}

      {/* Step 2 — chat, shown only after upload */}
      {activeDocument && (
        <ChatInterface
          documentId={activeDocument.documentId}
          fileName={activeDocument.fileName}
        />
      )}
    </div>
  )
}

export default App
