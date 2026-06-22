import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import type { ChatMessage } from '../hooks/useChat'

interface Props {
  messages: ChatMessage[]
  onSend: (text: string) => boolean
  disabled?: boolean
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function ChatPanel({ messages, onSend, disabled = false }: Props) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    list.scrollTop = list.scrollHeight
  }, [messages])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (disabled || !draft.trim()) return
    if (onSend(draft)) {
      setDraft('')
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 glass-card rounded-t-2xl border-b-0 overflow-hidden">
      <div className="shrink-0 px-4 py-3 border-b border-white/8">
        <h2 className="font-heading text-text-primary text-lg">Chat</h2>
        <p className="text-text-muted text-xs mt-0.5">Messages are only visible during this call</p>
      </div>

      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">
            No messages yet. Say hello ✦
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={[
                'flex flex-col max-w-[85%]',
                msg.isLocal ? 'ml-auto items-end' : 'mr-auto items-start',
              ].join(' ')}
            >
              {!msg.isLocal && (
                <span className="text-xs text-lavender/80 mb-1 px-1">
                  {msg.displayName}
                </span>
              )}
              <div
                className={[
                  'rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                  msg.isLocal
                    ? 'bg-lavender/20 text-text-primary rounded-br-md'
                    : 'bg-white/5 text-text-primary rounded-bl-md',
                ].join(' ')}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-text-muted/70 mt-1 px-1">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-white/8 pb-safe"
      >
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={disabled ? 'Waiting for the other person…' : 'Type a message…'}
          disabled={disabled}
          maxLength={2000}
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-lavender/40 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !draft.trim()}
          title="Send message"
          aria-label="Send message"
          className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-lavender/20 border border-lavender/30 text-lavender transition hover:bg-lavender/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
