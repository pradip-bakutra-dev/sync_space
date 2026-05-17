import { useState, useCallback } from 'react'

export interface ToastMessage {
  id: string
  text: string
  type: 'join' | 'leave' | 'info'
}

interface Props {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export default function Toast({ toasts }: Props) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={[
            'px-4 py-2 rounded-xl text-sm font-inter text-white shadow-lg',
            'animate-[fadeInUp_0.2s_ease-out]',
            t.type === 'join' ? 'bg-emerald-500/20 border border-emerald-500/30' :
            t.type === 'leave' ? 'bg-red-500/20 border border-red-500/30' :
            'bg-white/10 border border-white/20',
          ].join(' ')}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}

// Hook to manage toast state
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, text, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return { toasts, addToast }
}
