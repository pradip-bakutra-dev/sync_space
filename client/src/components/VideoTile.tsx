import { useEffect, useRef } from 'react'

interface Props {
  stream: MediaStream | null
  displayName: string
  muted?: boolean
  mirrored?: boolean
  isLocal?: boolean
  audioEnabled?: boolean
  videoEnabled?: boolean
  connectionState?: string
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function VideoTile({
  stream, displayName, muted = false, mirrored = false,
  isLocal = false, audioEnabled = true, videoEnabled = true,
  connectionState = 'connected',
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (stream) {
      video.srcObject = stream
      video.play().catch(() => {
        // Autoplay blocked — will play on user interaction
      })
    } else {
      video.srcObject = null
    }
  }, [stream])

  // Check if the stream actually has live video tracks
  const hasActiveVideo = !!stream && stream.getVideoTracks().some(t => t.enabled && t.readyState === 'live')
  const showVideo = hasActiveVideo && videoEnabled
  const isConnecting = connectionState === 'connecting'
  const isFailed = connectionState === 'failed'

  return (
    <div className="relative w-full h-full bg-[#111] rounded-2xl overflow-hidden flex items-center justify-center group">

      {/* Video element — always rendered, hidden when no video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={[
          'w-full h-full object-cover absolute inset-0 transition-opacity duration-300',
          showVideo ? 'opacity-100' : 'opacity-0',
          mirrored ? 'scale-x-[-1]' : '',
        ].join(' ')}
      />

      {/* Avatar fallback — shown when no video */}
      {!showVideo && (
        <div className="flex flex-col items-center gap-3 z-10">
          <div className="w-16 h-16 rounded-full bg-[#1f1f1f] border border-[#2a2a2a] flex items-center justify-center">
            <span className="font-syne font-bold text-white text-xl">
              {getInitials(displayName)}
            </span>
          </div>
          {isConnecting && (
            <span className="text-white/40 text-xs font-inter animate-pulse">Connecting...</span>
          )}
          {isFailed && (
            <span className="text-red-400 text-xs font-inter">Connection failed</span>
          )}
        </div>
      )}

      {/* Bottom bar: name + mic status */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between z-20">
        <span className="text-white text-xs font-inter truncate max-w-[80%]">
          {displayName}{isLocal ? ' (You)' : ''}
        </span>
        {!audioEnabled && (
          <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/>
            <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        )}
      </div>

      {/* Connection state dot — top right */}
      {!isLocal && (
        <div className={[
          'absolute top-2 right-2 w-2 h-2 rounded-full z-20',
          connectionState === 'connected' ? 'bg-green-400' :
          connectionState === 'failed' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
        ].join(' ')} />
      )}
    </div>
  )
}
