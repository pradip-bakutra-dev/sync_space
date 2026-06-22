import { useEffect, useRef, useState, useCallback } from 'react'
import { Socket } from 'socket.io-client'
import { MAX_ROOM_PARTICIPANTS } from '../utils/room'

// ── Types ────────────────────────────────────────────────────────────
export type PeerConnectionState = 'connecting' | 'connected' | 'failed' | 'disconnected'

export interface RemotePeer {
  socketId: string
  displayName: string
  stream: MediaStream | null
  connectionState: PeerConnectionState
  audioEnabled: boolean
  videoEnabled: boolean
}

interface PeerEntry {
  pc: RTCPeerConnection
  displayName: string
  iceCandidateQueue: RTCIceCandidateInit[]
  remoteDescSet: boolean
  makingOffer: boolean
}

// ── ICE Config ───────────────────────────────────────────────────────
function getRTCConfig(): RTCConfiguration {
  return {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: import.meta.env.VITE_TURN_URL ?? 'turn:openrelay.metered.ca:80',
        username: import.meta.env.VITE_TURN_USERNAME ?? 'openrelayproject',
        credential: import.meta.env.VITE_TURN_CREDENTIAL ?? 'openrelayproject',
      },
    ],
    iceCandidatePoolSize: 10,
  }
}

// ── Hook ─────────────────────────────────────────────────────────────
export function useWebRTC(
  socketRef: React.MutableRefObject<Socket | null>,
  localStream: MediaStream | null,
  roomId: string,
  displayName: string,
  onToast?: (text: string, type: 'join' | 'leave' | 'info') => void,
  onRoomFull?: () => void,
) {
  const peersRef = useRef<Map<string, PeerEntry>>(new Map())
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([])
  const onToastRef = useRef(onToast)
  const onRoomFullRef = useRef(onRoomFull)
  const localStreamRef = useRef(localStream)

  onToastRef.current = onToast
  onRoomFullRef.current = onRoomFull
  localStreamRef.current = localStream

  const syncPeers = useCallback(() => {
    setRemotePeers(prev => {
      const next: RemotePeer[] = []
      peersRef.current.forEach((entry, socketId) => {
        const existing = prev.find(p => p.socketId === socketId)
        next.push({
          socketId,
          displayName: entry.displayName,
          stream: existing?.stream ?? null,
          connectionState: (entry.pc.connectionState as PeerConnectionState) ?? 'connecting',
          audioEnabled: existing?.audioEnabled ?? true,
          videoEnabled: existing?.videoEnabled ?? true,
        })
      })
      return next
    })
  }, [])

  const setPeerStream = useCallback((socketId: string, stream: MediaStream) => {
    setRemotePeers(prev =>
      prev.map(p => p.socketId === socketId ? { ...p, stream } : p)
    )
  }, [])

  const setPeerState = useCallback((socketId: string, connectionState: PeerConnectionState) => {
    setRemotePeers(prev =>
      prev.map(p => p.socketId === socketId ? { ...p, connectionState } : p)
    )
  }, [])

  const drainIceQueue = useCallback(async (socketId: string) => {
    const entry = peersRef.current.get(socketId)
    if (!entry || !entry.remoteDescSet) return
    while (entry.iceCandidateQueue.length > 0) {
      const candidate = entry.iceCandidateQueue.shift()!
      try {
        await entry.pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (e) {
        console.warn('[ice] failed to add queued candidate', e)
      }
    }
  }, [])

  const removePeer = useCallback((socketId: string) => {
    const entry = peersRef.current.get(socketId)
    if (!entry) return
    entry.pc.ontrack = null
    entry.pc.onicecandidate = null
    entry.pc.onconnectionstatechange = null
    entry.pc.close()
    peersRef.current.delete(socketId)
    ;(window as Window & { __syncspacePeers?: Map<string, RTCPeerConnection> }).__syncspacePeers = new Map(
      Array.from(peersRef.current.entries()).map(([id, e]) => [id, e.pc])
    )
    setRemotePeers(prev => prev.filter(p => p.socketId !== socketId))
    console.log(`[webrtc] removed peer ${socketId}`)
  }, [])

  const createPeerConnection = useCallback((socketId: string, peerDisplayName: string): RTCPeerConnection => {
    const existing = peersRef.current.get(socketId)
    if (existing) return existing.pc

    const stream = localStreamRef.current
    const pc = new RTCPeerConnection(getRTCConfig())
    const entry: PeerEntry = {
      pc,
      displayName: peerDisplayName,
      iceCandidateQueue: [],
      remoteDescSet: false,
      makingOffer: false,
    }
    peersRef.current.set(socketId, entry)
    ;(window as Window & { __syncspacePeers?: Map<string, RTCPeerConnection> }).__syncspacePeers = new Map(
      Array.from(peersRef.current.entries()).map(([id, e]) => [id, e.pc])
    )

    if (stream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream))
    }

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams
      if (remoteStream) {
        console.log(`[webrtc] got track from ${socketId}`)
        setPeerStream(socketId, remoteStream)
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('signal:ice', { to: socketId, candidate: event.candidate.toJSON() })
      }
    }

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState as PeerConnectionState
      console.log(`[webrtc] ${socketId} connectionState → ${state}`)
      setPeerState(socketId, state)

      if (state === 'failed') {
        console.warn(`[webrtc] ${socketId} failed — attempting ICE restart`)
        pc.restartIce()
        setTimeout(() => removePeer(socketId), 8000)
      }
    }

    pc.onicegatheringstatechange = () => {
      console.log(`[webrtc] ${socketId} iceGathering → ${pc.iceGatheringState}`)
    }

    syncPeers()
    return pc
  }, [socketRef, setPeerStream, setPeerState, syncPeers, removePeer])

  const sendOffer = useCallback(async (socket: Socket, socketId: string) => {
    const entry = peersRef.current.get(socketId)
    if (!entry) return
    const { pc } = entry
    if (pc.signalingState !== 'stable') return

    try {
      entry.makingOffer = true
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit('signal:offer', { to: socketId, offer: pc.localDescription })
    } catch (e) {
      console.error(`[webrtc] failed to create offer for ${socketId}`, e)
    } finally {
      entry.makingOffer = false
    }
  }, [])

  // ── Main effect: wire up signaling once per room session ─────────
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !localStream || !roomId || !displayName) return

    const isPolite = (remoteId: string) => socket.id! < remoteId

    const onRoomJoined = async ({ peers }: { peers: { socketId: string; displayName: string }[] }) => {
      if (peers.length >= MAX_ROOM_PARTICIPANTS) {
        console.warn(`[room] room is full (${MAX_ROOM_PARTICIPANTS} participants)`)
        onRoomFullRef.current?.()
        socket.emit('room:leave')
        return
      }

      console.log(`[room] joined with ${peers.length} existing peers`)
      for (const peer of peers) {
        createPeerConnection(peer.socketId, peer.displayName)
        await sendOffer(socket, peer.socketId)
      }
    }

    const onPeerJoined = ({ socketId, displayName: peerName }: { socketId: string; displayName: string }) => {
      if (peersRef.current.has(socketId)) return
      if (peersRef.current.size >= MAX_ROOM_PARTICIPANTS - 1) {
        console.warn(`[room] ignoring peer ${peerName} — room at capacity`)
        return
      }
      console.log(`[room] peer joined: ${peerName} (${socketId})`)
      createPeerConnection(socketId, peerName)
      onToastRef.current?.(`${peerName} joined`, 'join')
    }

    const onPeerLeft = ({ socketId }: { socketId: string }) => {
      if (!peersRef.current.has(socketId)) return
      console.log(`[room] peer left: ${socketId}`)
      const leaving = peersRef.current.get(socketId)
      onToastRef.current?.(`${leaving?.displayName ?? 'Someone'} left`, 'leave')
      removePeer(socketId)
    }

    const onPeerMediaState = ({ socketId, audioEnabled, videoEnabled }: {
      socketId: string
      audioEnabled: boolean
      videoEnabled: boolean
    }) => {
      setRemotePeers(prev =>
        prev.map(p => p.socketId === socketId ? { ...p, audioEnabled, videoEnabled } : p)
      )
    }

    const onOffer = async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      let entry = peersRef.current.get(from)
      if (!entry) {
        createPeerConnection(from, 'Peer')
        entry = peersRef.current.get(from)!
      }

      const { pc } = entry
      const polite = isPolite(from)

      try {
        if (pc.signalingState === 'have-local-offer') {
          if (!polite) {
            console.log(`[webrtc] glare: ignoring offer from ${from} (impolite)`)
            return
          }
          console.log(`[webrtc] glare: rolling back local offer for ${from} (polite)`)
          await pc.setLocalDescription({ type: 'rollback' })
        } else if (pc.signalingState !== 'stable') {
          console.log(`[webrtc] ignoring offer from ${from} in state ${pc.signalingState}`)
          return
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        entry.remoteDescSet = true
        await drainIceQueue(from)

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('signal:answer', { to: from, answer: pc.localDescription })
      } catch (e) {
        console.error(`[webrtc] failed to handle offer from ${from}`, e)
      }
    }

    const onAnswer = async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      const entry = peersRef.current.get(from)
      if (!entry) return

      const { pc } = entry
      if (pc.signalingState !== 'have-local-offer') {
        console.log(`[webrtc] ignoring answer from ${from} in state ${pc.signalingState}`)
        return
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
        entry.remoteDescSet = true
        await drainIceQueue(from)
      } catch (e) {
        console.error(`[webrtc] failed to handle answer from ${from}`, e)
      }
    }

    const onIce = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const entry = peersRef.current.get(from)
      if (!entry) return
      if (entry.remoteDescSet) {
        try {
          await entry.pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (e) {
          console.warn('[ice] failed to add candidate', e)
        }
      } else {
        entry.iceCandidateQueue.push(candidate)
      }
    }

    const onRoomFull = () => {
      console.warn('[room] room is full (10 peers)')
    }

    socket.on('room:joined', onRoomJoined)
    socket.on('peer:joined', onPeerJoined)
    socket.on('peer:left', onPeerLeft)
    socket.on('signal:offer', onOffer)
    socket.on('signal:answer', onAnswer)
    socket.on('signal:ice', onIce)
    socket.on('peer:media-state', onPeerMediaState)
    socket.on('room:full', onRoomFull)

    socket.emit('room:join', { roomId, displayName })
    console.log(`[room] emitted room:join for ${roomId} as ${displayName}`)

    return () => {
      socket.off('room:joined', onRoomJoined)
      socket.off('peer:joined', onPeerJoined)
      socket.off('peer:left', onPeerLeft)
      socket.off('signal:offer', onOffer)
      socket.off('signal:answer', onAnswer)
      socket.off('signal:ice', onIce)
      socket.off('peer:media-state', onPeerMediaState)
      socket.off('room:full', onRoomFull)

      peersRef.current.forEach((_, socketId) => removePeer(socketId))
      socket.emit('room:leave')
    }
  }, [
    socketRef,
    localStream,
    roomId,
    displayName,
    createPeerConnection,
    removePeer,
    drainIceQueue,
    sendOffer,
  ])

  return { remotePeers, removePeer }
}
