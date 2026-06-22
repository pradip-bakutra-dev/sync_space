import { useEffect, useRef, useState } from 'react'
import {
  type CameraFacing,
  getCameraTrack,
  videoConstraints,
} from '../utils/camera'

export interface MediaState {
  stream: MediaStream | null
  videoEnabled: boolean
  audioEnabled: boolean
  facingMode: CameraFacing
  error: string | null
  loading: boolean
}

export function useMedia() {
  const [state, setState] = useState<MediaState>({
    stream: null,
    videoEnabled: true,
    audioEnabled: true,
    facingMode: 'user',
    error: null,
    loading: true,
  })
  const streamRef = useRef<MediaStream | null>(null)
  const facingRef = useRef<CameraFacing>('user')

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints('user'),
          audio: true,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        facingRef.current = 'user'
        setState((s) => ({ ...s, stream, loading: false, facingMode: 'user' }))
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

  async function flipCamera() {
    if (!streamRef.current || !state.videoEnabled) return

    const nextFacing: CameraFacing =
      facingRef.current === 'user' ? 'environment' : 'user'

    try {
      const newTrack = await getCameraTrack(nextFacing)
      const stream = streamRef.current
      const oldTrack = stream.getVideoTracks()[0]

      newTrack.enabled = state.videoEnabled
      if (oldTrack) {
        stream.removeTrack(oldTrack)
        oldTrack.stop()
      }
      stream.addTrack(newTrack)

      facingRef.current = nextFacing
      setState((s) => ({
        ...s,
        stream: new MediaStream(stream.getTracks()),
        facingMode: nextFacing,
      }))
    } catch {
      /* back camera unavailable on this device */
    }
  }

  return { ...state, toggleVideo, toggleAudio, flipCamera }
}
