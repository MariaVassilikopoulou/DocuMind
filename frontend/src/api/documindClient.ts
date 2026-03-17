import type {
  AskQuestionRequest,
  AskQuestionResponse,
  UploadDocumentResponse,
} from '../types/api'

// ---------------------------------------------------------------------------
// Thin fetch wrapper — all API calls live here so components stay clean.
// The Vite proxy (vite.config.ts) forwards /api/* → https://localhost:5001.
// ---------------------------------------------------------------------------

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    // Try to parse the { error: string } shape from the backend
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch('/api/documents/upload', {
    method: 'POST',
    body: form,
    // Note: do NOT set Content-Type manually — the browser must set the
    // multipart boundary itself when using FormData.
  })

  return handleResponse<UploadDocumentResponse>(res)
}

export async function askQuestion(
  documentId: string,
  request: AskQuestionRequest,
): Promise<AskQuestionResponse> {
  const res = await fetch(`/api/documents/${documentId}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  return handleResponse<AskQuestionResponse>(res)
}
