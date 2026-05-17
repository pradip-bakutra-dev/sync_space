import { useEffect, useRef, useState } from 'react'

export interface MediaState {
  stream: MediaStream | null
  videoEnabled: boolean
  audioEnabled: boolean
  error: string | null
  loading: boolean
}

export function useMedia() {
  const [state, setState] = useState<MediaState>({
    stream: null,
    videoEnabled: true,
    audioEnabled: true,
    error: null,
    loading: true,
  })
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        setState((s) => ({ ...s, stream, loading: false }))
      } catch {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error:
              'Camera or microphone access was denied. Please allow permissions and refresh.',
          }))
        }
      }
    }
    init()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  function toggleVideo() {
    if (!streamRef.current) return
    const enabled = !state.videoEnabled
    streamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = enabled
    })
    setState((s) => ({ ...s, videoEnabled: enabled }))
  }

  function toggleAudio() {
    if (!streamRef.current) return
    const enabled = !state.audioEnabled
    streamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = enabled
    })
    setState((s) => ({ ...s, audioEnabled: enabled }))
  }

  return { ...state, toggleVideo, toggleAudio }
}
