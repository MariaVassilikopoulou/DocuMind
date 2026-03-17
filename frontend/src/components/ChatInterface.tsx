import { useCallback, useEffect, useReducer, useRef } from 'react'
import { askQuestion } from '../api/documindClient'
import type { AskQuestionResponse, Citation } from '../types/api'

// =============================================================================
// STUB MODE
//
// true  → runs fully in-browser, no backend required.
// false → calls the real .NET API via the Vite proxy (vite.config.ts).
//
// The only function that reads this flag is fetchAnswer() below.
// Swapping to the real API = one line change.
// =============================================================================
const STUB_MODE = true

// -----------------------------------------------------------------------------
// Stub data — realistic enough to demo the full citation UX
// -----------------------------------------------------------------------------
const STUB_RESPONSES: AskQuestionResponse[] = [
  {
    answer:
      'According to Section 3.1, the payment terms require full settlement within 30 days ' +
      'of invoice date [1]. Late payments accrue interest at 1.5% per month as stated in ' +
      'the penalty clause [2].',
    citations: [
      {
        chunkIndex: 4,
        pageNumber: 3,
        excerpt:
          'All invoices are due and payable within thirty (30) days of the invoice date. ' +
          'Payment shall be made by bank transfer to the account specified on the invoice.',
      },
      {
        chunkIndex: 7,
        pageNumber: 4,
        excerpt:
          'Overdue amounts shall bear interest at the rate of 1.5% per month, or the maximum ' +
          'rate permitted by applicable law, whichever is lower.',
      },
    ],
  },
  {
    answer:
      'The termination clause [1] allows either party to end the agreement with 30 days ' +
      'written notice. Immediate termination is permitted only in cases of material breach ' +
      'that remains uncured after a 14-day notice period [2].',
    citations: [
      {
        chunkIndex: 12,
        pageNumber: 7,
        excerpt:
          'Either party may terminate this Agreement upon thirty (30) days prior written ' +
          'notice to the other party.',
      },
      {
        chunkIndex: 13,
        pageNumber: 7,
        excerpt:
          'Either party may terminate immediately upon written notice if the other party ' +
          'materially breaches this Agreement and fails to cure such breach within fourteen ' +
          '(14) days of receiving written notice of the breach.',
      },
    ],
  },
  {
    answer:
      'The confidentiality obligations [1] survive termination for a period of five years. ' +
      'Both parties are bound not to disclose proprietary information received under ' +
      'this agreement to any third party [2].',
    citations: [
      {
        chunkIndex: 18,
        pageNumber: 10,
        excerpt:
          'The obligations of confidentiality set forth in this Section shall survive the ' +
          'expiration or termination of this Agreement for a period of five (5) years.',
      },
      {
        chunkIndex: 19,
        pageNumber: 10,
        excerpt:
          'Each party agrees to hold the other\'s Confidential Information in strict confidence ' +
          'and not to disclose such information to any third party without prior written consent.',
      },
    ],
  },
]

// Rotate through stub responses so repeated questions feel less static
let stubCallCount = 0

async function fetchAnswer(
  documentId: string,
  question: string,
): Promise<AskQuestionResponse> {
  if (STUB_MODE) {
    // Simulate realistic network latency
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400))
    return STUB_RESPONSES[stubCallCount++ % STUB_RESPONSES.length]
  }

  // ─── REAL API ───────────────────────────────────────────────────────────────
  // To enable: set STUB_MODE = false above. No other changes needed.
  return askQuestion(documentId, { question })
}

// =============================================================================
// Types
// =============================================================================
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  isError?: boolean
}

interface ChatInterfaceProps {
  documentId: string
  fileName: string
}

// =============================================================================
// Reducer
//
// Using useReducer instead of multiple useState calls because these three
// pieces of state always change together: adding a message always triggers a
// loading transition, and receiving a response always ends loading.
// Keeping them in one reducer prevents inconsistent intermediate states.
// =============================================================================
interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
}

type ChatAction =
  | { type: 'SEND_QUESTION'; userMessage: ChatMessage }
  | { type: 'RECEIVE_ANSWER'; message: ChatMessage }
  | { type: 'RECEIVE_ERROR'; message: ChatMessage }

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SEND_QUESTION':
      return {
        messages: [...state.messages, action.userMessage],
        isLoading: true,
      }
    case 'RECEIVE_ANSWER':
    case 'RECEIVE_ERROR':
      return {
        messages: [...state.messages, action.message],
        isLoading: false,
      }
  }
}

// =============================================================================
// Sub-component: CitationCard
//
// Each citation is independently collapsible so users can inspect only the
// sources they care about without the full excerpt cluttering the view.
// =============================================================================
function CitationCard({ citation, index }: { citation: Citation; index: number }) {
  // Each card manages only its own open/closed state — no lifting needed
  const [expanded, toggleExpanded] = useReducer((v: boolean) => !v, false)
  const headingId = `citation-heading-${index}`
  const bodyId    = `citation-body-${index}`

  return (
    <div style={citationStyles.card}>
      <button
        id={headingId}
        aria-expanded={expanded}
        aria-controls={bodyId}
        onClick={toggleExpanded}
        style={citationStyles.toggle}
      >
        {/* Numbered badge that matches the [N] reference in the answer text */}
        <span style={citationStyles.badge}>[{index + 1}]</span>

        <span style={citationStyles.meta}>
          Chunk {citation.chunkIndex}
          {citation.pageNumber != null ? ` · Page ${citation.pageNumber}` : ''}
        </span>

        {/* Chevron rotates on expand — driven by inline transform */}
        <span
          style={{
            ...citationStyles.chevron,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <p
          id={bodyId}
          role="region"
          aria-labelledby={headingId}
          style={citationStyles.excerpt}
        >
          {citation.excerpt}
        </p>
      )}
    </div>
  )
}

// =============================================================================
// Sub-component: TypingIndicator
//
// Three animated dots shown while the API call is in flight.
// The @keyframes rule is injected once via a <style> tag — inline styles
// alone cannot define keyframes, which is why the dots previously didn't move.
// =============================================================================
const KEYFRAMES = `
  @keyframes dm-blink {
    0%, 80%, 100% { opacity: 0.2; transform: translateY(0px);   }
    40%            { opacity: 1;   transform: translateY(-4px);  }
  }
  .dm-dot        { animation: dm-blink 1.4s ease-in-out infinite; }
  .dm-dot:nth-child(2) { animation-delay: 0.2s; }
  .dm-dot:nth-child(3) { animation-delay: 0.4s; }
`

function TypingIndicator() {
  return (
    <>
      {/* Self-contained keyframes — no external CSS file needed */}
      <style>{KEYFRAMES}</style>

      <div style={{ ...msgStyles.row, justifyContent: 'flex-start' }}>
        <div>
          <div style={msgStyles.roleLabel}>DocuMind</div>
          <div style={{ ...msgStyles.bubble, ...msgStyles.assistantBubble, ...msgStyles.typingBubble }}>
            <span className="dm-dot" style={msgStyles.dot} />
            <span className="dm-dot" style={msgStyles.dot} />
            <span className="dm-dot" style={msgStyles.dot} />
          </div>
        </div>
      </div>
    </>
  )
}

// =============================================================================
// Sub-component: MessageBubble
//
// Renders one turn in the conversation. User messages are right-aligned and
// blue; assistant messages are left-aligned and grey. Error messages reuse the
// assistant slot with a red variant so the layout stays consistent.
// =============================================================================
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div style={{ ...msgStyles.row, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{ maxWidth: '78%' }}>

        <div style={{ ...msgStyles.roleLabel, textAlign: isUser ? 'right' : 'left' }}>
          {isUser ? 'You' : 'DocuMind'}
        </div>

        <div
          style={{
            ...msgStyles.bubble,
            ...(isUser   ? msgStyles.userBubble      : msgStyles.assistantBubble),
            ...(message.isError ? msgStyles.errorBubble : {}),
          }}
        >
          {message.content}
        </div>

        {/* Citations — assistant-only, only when present */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div style={citationStyles.container}>
            <p style={citationStyles.heading}>Sources</p>
            {message.citations.map((c, i) => (
              <CitationCard key={`${message.id}-c${i}`} citation={c} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Main component: ChatInterface
// =============================================================================
export function ChatInterface({ documentId, fileName }: ChatInterfaceProps) {
  const [state, dispatch] = useReducer(chatReducer, {
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `"${fileName}" is ready. Ask me anything about it.`,
      },
    ],
    isLoading: false,
  })

  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputText = useRef('')  // tracks textarea value without a re-render on every keystroke

  // Sync the visible textarea value with our ref
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    inputText.current = e.target.value
    // Force a re-render only to update the Send button's disabled state
    // (we read inputText.current, not state, so this is minimal)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  // Auto-scroll whenever the message list grows or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages, state.isLoading])

  // Focus the textarea on first render
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // ---------------------------------------------------------------------------
  // handleSend — wrapped in useCallback so MessageBubble/CitationCard siblings
  // don't re-render just because the parent re-renders during loading.
  // ---------------------------------------------------------------------------
  const handleSend = useCallback(async () => {
    const question = inputText.current.trim()
    if (!question || state.isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    }

    dispatch({ type: 'SEND_QUESTION', userMessage })

    // Clear and reset textarea height
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.style.height = 'auto'
      inputRef.current.focus()
    }
    inputText.current = ''

    try {
      const response = await fetchAnswer(documentId, question)

      dispatch({
        type: 'RECEIVE_ANSWER',
        message: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.answer,
          citations: response.citations,
        },
      })
    } catch (err) {
      dispatch({
        type: 'RECEIVE_ERROR',
        message: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
          isError: true,
        },
      })
    }
  }, [documentId, state.isLoading])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div style={layoutStyles.container}>

      {/* ── Header ── */}
      <div style={layoutStyles.header}>
        <div>
          <div style={layoutStyles.headerTitle}>Chat with your document</div>
          <div style={layoutStyles.headerSub}>
            <span>{fileName}</span>
            {STUB_MODE && <span style={layoutStyles.stubBadge}>STUB MODE</span>}
          </div>
        </div>
        <span style={layoutStyles.messageCount}>
          {state.messages.length - 1} message{state.messages.length !== 2 ? 's' : ''}
        </span>
      </div>

      {/* ── Message list ── */}
      <div style={layoutStyles.messageList}>
        {state.messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {state.isLoading && <TypingIndicator />}

        {/* Invisible anchor — scrolled into view on each update */}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div style={layoutStyles.inputArea}>
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="Ask a question about the document…"
          disabled={state.isLoading}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          style={{
            ...layoutStyles.textarea,
            opacity: state.isLoading ? 0.6 : 1,
          }}
        />
        <button
          onClick={handleSend}
          disabled={state.isLoading}
          aria-label="Send"
          style={{
            ...layoutStyles.sendButton,
            opacity: state.isLoading ? 0.45 : 1,
            cursor: state.isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {state.isLoading ? '…' : '↑'}
        </button>
      </div>

      <p style={layoutStyles.hint}>Enter to send · Shift + Enter for a new line</p>
    </div>
  )
}

// =============================================================================
// Styles
//
// Split into three namespaced objects so it's obvious which styles belong
// to layout, message bubbles, or citations respectively.
// =============================================================================

const layoutStyles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 680,
    margin: '24px auto 0',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontWeight: 600,
    fontSize: 15,
    color: '#1e293b',
  },
  headerSub: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    fontSize: 12,
    color: '#64748b',
  },
  stubBadge: {
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '2px 6px',
    borderRadius: 4,
    border: '1px solid #fcd34d',
    letterSpacing: '0.04em',
  },
  messageCount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  messageList: {
    overflowY: 'auto',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    minHeight: 360,
    maxHeight: 540,
  },
  inputArea: {
    display: 'flex',
    gap: 8,
    padding: '12px 16px',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    resize: 'none',
    overflowY: 'hidden',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    fontSize: 14,
    lineHeight: 1.5,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    outline: 'none',
    backgroundColor: '#ffffff',
    maxHeight: 120,
    transition: 'border-color 0.15s',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'opacity 0.15s',
  },
  hint: {
    margin: 0,
    padding: '4px 0 10px',
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
  },
}

const msgStyles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    width: '100%',
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  bubble: {
    padding: '11px 15px',
    borderRadius: 14,
    fontSize: 14,
    lineHeight: 1.65,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderBottomRightRadius: 3,
  },
  assistantBubble: {
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    borderBottomLeftRadius: 3,
  },
  errorBubble: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
  },
  typingBubble: {
    display: 'flex',
    gap: 5,
    alignItems: 'center',
    padding: '14px 16px',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    backgroundColor: '#94a3b8',
    display: 'inline-block',
    flexShrink: 0,
  },
}

const citationStyles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: 10,
  },
  heading: {
    margin: '0 0 6px',
    fontSize: 11,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    marginBottom: 6,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  toggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 13,
  },
  badge: {
    fontWeight: 700,
    color: '#3b82f6',
    flexShrink: 0,
    minWidth: 24,
  },
  meta: {
    flex: 1,
    color: '#475569',
    fontSize: 12,
  },
  chevron: {
    fontSize: 10,
    color: '#94a3b8',
    flexShrink: 0,
    transition: 'transform 0.2s ease',
    display: 'inline-block',
  },
  excerpt: {
    margin: 0,
    padding: '8px 12px 12px',
    fontSize: 13,
    color: '#475569',
    lineHeight: 1.65,
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
  },
}
