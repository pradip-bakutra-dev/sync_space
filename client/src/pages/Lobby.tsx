import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import VideoPreview from '../components/VideoPreview'
import { useMedia } from '../hooks/useMedia'

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

function CameraOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2" />
      <path d="M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5" />
      <path d="M14.121 14.121A3 3 0 0 1 9.88 9.88" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white/30"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function CameraOffLargeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white/30"
    >
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2" />
      <path d="M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5" />
    </svg>
  )
}

function getInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Lobby() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const {
    stream,
    videoEnabled,
    audioEnabled,
    error,
    loading,
    toggleVideo,
    toggleAudio,
  } = useMedia()

  const [displayName, setDisplayName] = useState('')
  const [copied, setCopied] = useState(false)

  const initials = getInitials(displayName)
  const canJoin =
    displayName.trim().length >= 2 && !loading && !error

  async function handleCopy() {
    if (!roomId) return
    try {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  function handleJoin() {
    if (!canJoin || !roomId) return

    const name = displayName.trim()
    sessionStorage.setItem('syncspace_name', name)
    sessionStorage.setItem('syncspace_room', roomId)

    navigate(`/room/${roomId}`)
    stream?.getTracks().forEach((t) => t.stop())
  }

  const mediaToggleBase =
    'rounded-full w-12 h-12 border flex items-center justify-center transition-all'
  const mediaToggleOn =
    'border-[#1f1f1f] bg-[#111] text-white hover:border-accent/50'
  const mediaToggleOff =
    'bg-red-500/20 text-red-400 border-red-500/30'

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-inter text-white">
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-4xl mx-auto px-4 py-8 lg:py-12">
        {/* Camera preview */}
        <div className="w-full lg:w-1/2">
          <div className="relative aspect-video bg-[#111] rounded-2xl overflow-hidden flex items-center justify-center">
            {loading && (
              <div
                className="w-10 h-10 rounded-full border-2 border-white/20 border-t-[#6ee7b7] animate-spin"
                role="status"
                aria-label="Loading camera"
              />
            )}

            {!loading && error && (
              <div className="flex flex-col items-center gap-4 px-6 text-center">
                <CameraOffLargeIcon />
                <p className="text-sm text-white/60 max-w-xs">{error}</p>
              </div>
            )}

            {!loading && !error && !videoEnabled && (
              <div className="flex flex-col items-center justify-center gap-3">
                {initials ? (
                  <span className="font-syne text-5xl font-bold text-white/80">
                    {initials}
                  </span>
                ) : (
                  <PersonIcon />
                )}
              </div>
            )}

            {!loading && !error && videoEnabled && stream && (
              <VideoPreview
                stream={stream}
                className="w-full h-full object-cover rounded-2xl scale-x-[-1]"
              />
            )}
          </div>

          {!loading && !error && (
            <div className="mt-4 flex justify-center gap-4">
              <button
                type="button"
                onClick={toggleAudio}
                aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                className={`${mediaToggleBase} ${audioEnabled ? mediaToggleOn : mediaToggleOff}`}
              >
                {audioEnabled ? <MicIcon /> : <MicOffIcon />}
              </button>
              <button
                type="button"
                onClick={toggleVideo}
                aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                className={`${mediaToggleBase} ${videoEnabled ? mediaToggleOn : mediaToggleOff}`}
              >
                {videoEnabled ? <CameraIcon /> : <CameraOffIcon />}
              </button>
            </div>
          )}
        </div>

        {/* Setup panel */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <p className="font-syne text-sm text-white/40 mb-6">SyncSpace</p>

          <h1 className="font-syne font-bold text-2xl mb-2">Ready to join?</h1>
          <p className="font-mono text-sm tracking-widest text-accent mb-8">
            Room · {roomId}
          </p>

          <div className="mb-6">
            <label
              htmlFor="displayName"
              className="lobby-label"
            >
              Your name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              maxLength={24}
              className="lobby-input"
            />
          </div>

          <div className="mb-8">
            <span className="lobby-label">Room code</span>
            <div className="flex gap-2 mt-2">
              <div className="lobby-code-box flex-1">
                {roomId}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="lobby-copy-btn"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleJoin}
            disabled={!canJoin}
            className="btn-primary btn-primary-full"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  )
}

