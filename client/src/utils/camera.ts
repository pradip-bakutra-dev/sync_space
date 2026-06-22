export type CameraFacing = 'user' | 'environment'

export function isMobileCameraDevice(): boolean {
  if (typeof window === 'undefined') return false
  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const narrow = window.matchMedia('(max-width: 768px)').matches
  return touch && narrow
}

export function flipFacing(facing: CameraFacing): CameraFacing {
  return facing === 'user' ? 'environment' : 'user'
}

export function videoConstraints(facing: CameraFacing): MediaTrackConstraints {
  return { facingMode: { ideal: facing } }
}

export async function getCameraTrack(facing: CameraFacing): Promise<MediaStreamTrack> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: videoConstraints(facing),
    audio: false,
  })
  const track = stream.getVideoTracks()[0]
  if (!track) {
    stream.getTracks().forEach((t) => t.stop())
    throw new Error('No video track available')
  }
  return track
}
