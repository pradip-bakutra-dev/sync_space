import type { ReactNode } from 'react'

interface Props {
  audioEnabled: boolean
  videoEnabled: boolean
  isScreenSharing: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onLeave: () => void
}

interface IconBtnProps {
  onClick: () => void
  active: boolean
  label: string
  children: ReactNode
}

function IconBtn({ onClick, active, label, children }: IconBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={[
        'w-12 h-12 rounded-full flex items-center justify-center transition-all border',
        active
          ? 'bg-[#1f1f1f] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]'
          : 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export default function ControlBar({
  audioEnabled,
  videoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeave,
}: Props) {
  return (
    <div className="flex items-center justify-center gap-4 py-4 pb-safe">

      {/* Mic */}
      <IconBtn onClick={onToggleAudio} active={audioEnabled} label={audioEnabled ? 'Mute mic' : 'Unmute mic'}>
        {audioEnabled ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8"/>
          </svg>
        )}
      </IconBtn>

      {/* Camera */}
      <IconBtn onClick={onToggleVideo} active={videoEnabled} label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}>
        {videoEnabled ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21H5a2 2 0 01-2-2V8m2-2h6.343M15 10l4.553-2.276A1 1 0 0121 8.723v6.554"/>
          </svg>
        )}
      </IconBtn>

      {/* Screen share */}
      <IconBtn
        onClick={onToggleScreenShare}
        active={!isScreenSharing}
        label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path strokeLinecap="round" d="M8 21h8M12 17v4"/>
        </svg>
      </IconBtn>

      {/* Leave — red */}
      <button
        type="button"
        onClick={onLeave}
        title="Leave room"
        className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 transition flex items-center justify-center text-white"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5M21 12H9M13 7a9 9 0 100 10"/>
        </svg>
      </button>

    </div>
  )
}
