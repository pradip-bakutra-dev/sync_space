import { useCallback, useEffect, useState, type RefObject } from 'react'
import type { Socket } from 'socket.io-client'

export interface ChatMessage {
  id: string
  socketId: string
  displayName: string
  text: string
  timestamp: number
  isLocal: boolean
}

interface IncomingChatMessage {
  socketId: string
  displayName: string
  text: string
  timestamp: number
}

export function useChat(
  socketRef: RefObject<Socket | null>,
  roomId: string,
  localSocketId: string | undefined,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const onMessage = (payload: IncomingChatMessage) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${payload.socketId}-${payload.timestamp}`,
          socketId: payload.socketId,
          displayName: payload.displayName,
          text: payload.text,
          timestamp: payload.timestamp,
          isLocal: payload.socketId === localSocketId,
        },
      ])
    }

    socket.on('chat:message', onMessage)
    return () => {
      socket.off('chat:message', onMessage)
    }
  }, [socketRef, localSocketId])

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !roomId) return false

      socketRef.current?.emit('chat:message', { roomId, text: trimmed })
      return true
    },
    [roomId, socketRef],
  )

  return { messages, sendMessage }
}
