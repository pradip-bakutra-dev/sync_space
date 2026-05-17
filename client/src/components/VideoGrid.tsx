import VideoTile from './VideoTile'
import type { RemotePeer } from '../hooks/useWebRTC'

interface LocalUser {
  stream: MediaStream | null
  displayName: string
  audioEnabled: boolean
  videoEnabled: boolean
}

interface Props {
  localUser: LocalUser
  remotePeers: RemotePeer[]
}

function getGridClass(total: number): string {
  if (total === 1) return 'grid-cols-1'
  if (total === 2) return 'grid-cols-1 sm:grid-cols-2'
  if (total <= 4) return 'grid-cols-2'
  if (total <= 6) return 'grid-cols-2 sm:grid-cols-3'
  return 'grid-cols-2 sm:grid-cols-3'
}

export default function VideoGrid({ localUser, remotePeers }: Props) {
  const total = remotePeers.length + 1 // +1 for local
  const gridClass = getGridClass(total)

  return (
    <div className={`grid gap-2 w-full h-full overflow-y-auto ${gridClass}`}>
      {/* Local tile always first */}
      <VideoTile
        stream={localUser.stream}
        displayName={localUser.displayName}
        muted={true}
        mirrored={true}
        isLocal={true}
        audioEnabled={localUser.audioEnabled}
        videoEnabled={localUser.videoEnabled}
        connectionState="connected"
      />

      {/* Remote peers */}
      {remotePeers.map(peer => (
        <VideoTile
          key={peer.socketId}
          stream={peer.stream}
          displayName={peer.displayName}
          muted={false}
          mirrored={false}
          isLocal={false}
          audioEnabled={peer.audioEnabled}
          videoEnabled={peer.videoEnabled}
          connectionState={peer.connectionState}
        />
      ))}
    </div>
  )
}
