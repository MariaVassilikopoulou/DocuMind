// ---------------------------------------------------------------------------
// API request / response types — must stay in sync with the backend DTOs in
// DocuMind.Application/DTOs/
// ---------------------------------------------------------------------------

// POST /api/documents/upload
export interface UploadDocumentResponse {
  documentId: string
  fileName: string
  chunkCount: number
}

// POST /api/documents/{documentId}/ask
export interface AskQuestionRequest {
  question: string
}

export interface Citation {
  chunkIndex: number
  pageNumber: number | null
  excerpt: string
}

export interface AskQuestionResponse {
  answer: string
  citations: Citation[]
}

// Generic API error shape returned by the backend
export interface ApiError {
  error: string
}
