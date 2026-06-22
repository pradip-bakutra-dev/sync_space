import { useEffect, useState } from 'react'
import { isMobileCameraDevice } from '../utils/camera'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(isMobileCameraDevice)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(isMobileCameraDevice())
    mq.addEventListener('change', update)
    window.addEventListener('orientationchange', update)
    return () => {
      mq.removeEventListener('change', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return isMobile
}
