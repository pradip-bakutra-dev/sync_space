import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSignaling } from '../hooks/useSignaling'
import { useWebRTC } from '../hooks/useWebRTC'
import VideoGrid from '../components/VideoGrid'
import ControlBar from '../components/ControlBar'
import ChatPanel from '../components/ChatPanel'
import Toast, { useToast } from '../components/Toast'
import Starfield from '../components/Starfield'
import { MAX_ROOM_PARTICIPANTS } from '../utils/room'
import {
  type CameraFacing,
  flipFacing,
  getCameraTrack,
  videoConstraints,
} from '../utils/camera'
import { useIsMobile } from '../hooks/useIsMobile'
import { useChat } from '../hooks/useChat'

type SyncSpaceWindow = Window & {
  __syncspacePeers?: Map<string, RTCPeerConnection>
}

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const displayName = sessionStorage.getItem('syncspace_name') ?? ''

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
  const [chatOpen, setChatOpen] = useState(false)
  const [localSocketId, setLocalSocketId] = useState<string>()
  const [facingMode, setFacingMode] = useState<CameraFacing>(() => {
    const saved = sessionStorage.getItem('syncspace_facing')
    return saved === 'environment' ? 'environment' : 'user'
  })
  const screenTrackRef = useRef<MediaStreamTrack | null>(null)
  const isScreenSharingRef = useRef(false)
  const facingModeRef = useRef<CameraFacing>(facingMode)
  const isMobile = useIsMobile()

  facingModeRef.current = facingMode

  const socketRef = useSignaling()
  const { toasts, addToast } = useToast()
  const { remotePeers } = useWebRTC(
    socketRef,
    localStream,
    roomId ?? '',
    displayName,
    addToast,
    () => setRoomFull(true),
  )

  const participantCount = remotePeers.length + 1
  const chatVisible = participantCount <= 2
  const chatEnabled = participantCount === 2
  const { messages, sendMessage } = useChat(socketRef, roomId ?? '', localSocketId)

  useEffect(() => {
    if (participantCount > 2 && chatOpen) {
      setChatOpen(false)
    }
  }, [participantCount, chatOpen])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const syncId = () => setLocalSocketId(socket.id)
    if (socket.connected) syncId()
    socket.on('connect', syncId)
    return () => {
      socket.off('connect', syncId)
    }
  }, [socketRef])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return
    const onFull = () => setRoomFull(true)
    socket.on('room:full', onFull)
    return () => { socket.off('room:full', onFull) }
  }, [socketRef])

  useEffect(() => {
    let stream: MediaStream | null = null
    const facing = facingModeRef.current
    navigator.mediaDevices.getUserMedia({ video: videoConstraints(facing), audio: true })
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

  const flipCamera = useCallback(async () => {
    if (!localStream || isScreenSharingRef.current || !videoEnabled) return

    const peerConnections = (window as SyncSpaceWindow).__syncspacePeers
    const nextFacing = flipFacing(facingModeRef.current)

    try {
      const newTrack = await getCameraTrack(nextFacing)
      const oldTrack = localStream.getVideoTracks()[0]

      newTrack.enabled = videoEnabled
      if (oldTrack) {
        localStream.removeTrack(oldTrack)
        oldTrack.stop()
      }
      localStream.addTrack(newTrack)

      peerConnections?.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
        sender?.replaceTrack(newTrack)
      })

      facingModeRef.current = nextFacing
      setFacingMode(nextFacing)
      sessionStorage.setItem('syncspace_facing', nextFacing)
      setLocalStream(new MediaStream(localStream.getTracks()))
    } catch (e) {
      console.warn('[camera] flip failed', e)
      addToast('Could not switch camera', 'info')
    }
  }, [localStream, videoEnabled, addToast])

  const toggleScreenShare = useCallback(async () => {
    if (!localStream) return

    const peerConnections = (window as SyncSpaceWindow).__syncspacePeers

    if (isScreenSharingRef.current) {
      const cameraTrack = await getCameraTrack(facingModeRef.current)

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
    <div className="h-screen bg-midnight flex flex-col overflow-hidden relative">

      <Starfield animated={false} />

      <span
        className="fixed top-5 right-6 z-30 text-lavender/20 text-lg pointer-events-none select-none"
        aria-hidden="true"
      >
        ✦
      </span>

      {roomFull && (
        <div className="fixed inset-0 bg-midnight/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card rounded-2xl p-8 text-center max-w-sm mx-4">
            <div className="text-4xl mb-4">🌙</div>
            <h2 className="font-heading text-text-primary text-2xl mb-2">Room is full</h2>
            <p className="text-text-muted text-sm mb-6">
              This room already has {MAX_ROOM_PARTICIPANTS} participants. Maximum is {MAX_ROOM_PARTICIPANTS} people per call.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-gradient px-8"
            >
              Go back
            </button>
          </div>
        </div>
      )}

      <div
        className={[
          'relative z-10 flex-1 min-h-0',
          chatOpen && chatEnabled ? 'flex flex-col pb-28' : 'pb-28',
        ].join(' ')}
      >
        <div className={[
          chatOpen && chatEnabled ? 'h-1/2 min-h-0 shrink-0' : 'h-full min-h-0',
          'relative',
        ].join(' ')}>
          <VideoGrid
            localUser={{
              stream: localStream,
              displayName,
              audioEnabled,
              videoEnabled,
              mirrorLocal: facingMode === 'user',
            }}
            remotePeers={remotePeers}
          />
          {remotePeers.length === 0 && !chatOpen && (
            <div className="absolute inset-0 flex items-end justify-center pb-32 pointer-events-none">
              <div className="glass-card rounded-2xl px-6 py-4 text-center max-w-xs">
                <p className="text-text-muted text-sm mb-2">Waiting for them to join...</p>
                <p className="text-gold font-body tracking-widest text-lg font-semibold">{roomId}</p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/lobby/${roomId}`)
                    addToast('Invite link copied ✦', 'info')
                  }}
                  className="pointer-events-auto mt-3 text-xs text-text-muted hover:text-lavender transition underline underline-offset-2"
                >
                  Copy invite link
                </button>
              </div>
            </div>
          )}
        </div>

        {chatOpen && chatEnabled && (
          <div className="h-1/2 min-h-0 shrink-0">
            <ChatPanel
              messages={messages}
              onSend={sendMessage}
            />
          </div>
        )}
      </div>

      <ControlBar
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        isScreenSharing={isScreenSharing}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onLeave={handleLeave}
        showFlipCamera={isMobile}
        onFlipCamera={flipCamera}
        canFlipCamera={videoEnabled && !isScreenSharing}
        showChat={chatVisible}
        chatOpen={chatOpen}
        chatEnabled={chatEnabled}
        onToggleChat={() => setChatOpen((open) => !open)}
      />

      <Toast toasts={toasts} onDismiss={() => {}} />

    </div>
  )
}
