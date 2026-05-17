import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSignaling } from '../hooks/useSignaling'
import { useWebRTC } from '../hooks/useWebRTC'
import VideoGrid from '../components/VideoGrid'
import ControlBar from '../components/ControlBar'
import Toast, { useToast } from '../components/Toast'

type SyncSpaceWindow = Window & {
  __syncspacePeers?: Map<string, RTCPeerConnection>
}

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const displayName = sessionStorage.getItem('syncspace_name') ?? ''

  // Guard: if no name, send to lobby first
  useEffect(() => {
    if (!displayName.trim()) {
      navigate(`/lobby/${roomId}`, { replace: true })
    }
  }, [displayName, roomId, navigate])

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [roomFull, setRoomFull] = useState(false)
  const screenTrackRef = useRef<MediaStreamTrack | null>(null)
  const isScreenSharingRef = useRef(false)

  const socketRef = useSignaling()
  const { toasts, addToast } = useToast()
  const { remotePeers } = useWebRTC(socketRef, localStream, roomId ?? '', displayName, addToast)

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return
    const onFull = () => setRoomFull(true)
    socket.on('room:full', onFull)
    return () => { socket.off('room:full', onFull) }
  }, [socketRef])

  // Acquire local stream once on mount
  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .catch(() => navigator.mediaDevices.getUserMedia({ audio: true }))
      .then(s => {
        stream = s
        setLocalStream(s)
        socketRef.current?.emit('peer:media-state', { roomId, audioEnabled: true, videoEnabled: true })
      })
      .catch(console.error)
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [roomId, socketRef])

  const toggleAudio = useCallback(() => {
    if (!localStream) return
    const next = !audioEnabled
    localStream.getAudioTracks().forEach(t => { t.enabled = next })
    setAudioEnabled(next)
    socketRef.current?.emit('peer:media-state', {
      roomId,
      audioEnabled: next,
      videoEnabled,
    })
  }, [localStream, audioEnabled, videoEnabled, roomId, socketRef])

  const toggleVideo = useCallback(() => {
    if (!localStream) return
    const next = !videoEnabled
    localStream.getVideoTracks().forEach(t => { t.enabled = next })
    setVideoEnabled(next)
    socketRef.current?.emit('peer:media-state', {
      roomId,
      audioEnabled,
      videoEnabled: next,
    })
  }, [localStream, videoEnabled, audioEnabled, roomId, socketRef])

  const toggleScreenShare = useCallback(async () => {
    if (!localStream) return

    const peerConnections = (window as SyncSpaceWindow).__syncspacePeers

    if (isScreenSharingRef.current) {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true })
      const cameraTrack = cameraStream.getVideoTracks()[0]

      socketRef.current?.emit('peer:media-state', {
        roomId,
        audioEnabled,
        videoEnabled: true,
      })

      const oldTrack = localStream.getVideoTracks()[0]
      if (oldTrack) localStream.removeTrack(oldTrack)
      localStream.addTrack(cameraTrack)

      peerConnections?.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video')
        sender?.replaceTrack(cameraTrack)
      })

      screenTrackRef.current?.stop()
      screenTrackRef.current = null
      isScreenSharingRef.current = false
      setIsScreenSharing(false)
      setVideoEnabled(true)
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const screenTrack = screenStream.getVideoTracks()[0]
        screenTrackRef.current = screenTrack

        const oldTrack = localStream.getVideoTracks()[0]
        if (oldTrack) localStream.removeTrack(oldTrack)
        localStream.addTrack(screenTrack)

        peerConnections?.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          sender?.replaceTrack(screenTrack)
        })

        screenTrack.onended = () => { toggleScreenShare() }

        isScreenSharingRef.current = true
        setIsScreenSharing(true)
        setVideoEnabled(true)
        socketRef.current?.emit('peer:media-state', {
          roomId,
          audioEnabled,
          videoEnabled: true,
        })
      } catch (e) {
        console.warn('[screen] share cancelled or denied', e)
      }
    }
  }, [localStream, audioEnabled, videoEnabled, roomId, socketRef])

  const handleLeave = useCallback(() => {
    localStream?.getTracks().forEach(t => t.stop())
    screenTrackRef.current?.stop()
    socketRef.current?.emit('room:leave')
    socketRef.current?.disconnect()
    navigate('/')
  }, [localStream, socketRef, navigate])

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">

      {roomFull && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-2xl p-8 text-center max-w-sm mx-4">
            <div className="text-4xl mb-4">🚫</div>
            <h2 className="font-syne font-bold text-white text-xl mb-2">Room is full</h2>
            <p className="text-white/50 text-sm font-inter mb-6">This room already has 10 participants.</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="bg-white text-black font-medium px-6 py-2 rounded-xl hover:opacity-90 transition"
            >
              Go back
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1a1a1a] flex-shrink-0">
        <span className="font-syne font-bold text-white text-lg">SyncSpace</span>
        <button
          type="button"
          onClick={() => { navigator.clipboard.writeText(roomId ?? ''); addToast('Room code copied!', 'info') }}
          className="font-mono text-xs text-white/30 tracking-widest hover:text-white/60 transition cursor-pointer"
          title="Click to copy room code"
        >
          {roomId}
        </button>
        <span className="text-xs text-white/30 font-inter">
          {remotePeers.length + 1} in room
        </span>
      </div>

      {/* Video grid — takes all remaining space */}
      <div className="flex-1 p-3 min-h-0 relative">
        <VideoGrid
          localUser={{ stream: localStream, displayName, audioEnabled, videoEnabled }}
          remotePeers={remotePeers}
        />
        {remotePeers.length === 0 && (
          <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
            <div className="bg-[#111]/80 backdrop-blur-sm border border-[#1f1f1f] rounded-2xl px-6 py-4 text-center">
              <p className="text-white/60 text-sm font-inter mb-2">Waiting for others to join...</p>
              <p className="text-white font-mono tracking-widest text-lg font-bold">{roomId}</p>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/lobby/${roomId}`); addToast('Link copied!', 'info') }}
                className="pointer-events-auto mt-3 text-xs text-white/40 hover:text-white transition underline underline-offset-2"
              >
                Copy invite link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="flex-shrink-0 border-t border-[#1a1a1a]">
        <ControlBar
          audioEnabled={audioEnabled}
          videoEnabled={videoEnabled}
          isScreenSharing={isScreenSharing}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={toggleScreenShare}
          onLeave={handleLeave}
        />
      </div>

      <Toast toasts={toasts} onDismiss={() => {}} />

    </div>
  )
}
