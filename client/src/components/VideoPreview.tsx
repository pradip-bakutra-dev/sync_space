import { useEffect, useRef } from 'react'

interface Props {
  stream: MediaStream | null
  muted?: boolean
  className?: string
}

export default function VideoPreview({
  stream,
  muted = true,
  className = '',
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={className}
    />
  )
}
