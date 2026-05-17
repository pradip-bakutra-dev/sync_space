import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001'

export function useSignaling() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket
    socket.on('connect', () => console.log('[socket] connected:', socket.id))
    socket.on('disconnect', (r) => console.log('[socket] disconnected:', r))
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  return socketRef
}
