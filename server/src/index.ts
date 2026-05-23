import express from 'express'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import cors from 'cors'

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_URL ?? '*']
  : ['http://localhost:5173', 'http://localhost:5174']

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

app.use(cors({
  origin: allowedOrigins,
}))

// ── Types ────────────────────────────────────────────────
interface Peer {
  socketId: string
  displayName: string
  joinedAt: number
}

interface Room {
  roomId: string
  peers: Map<string, Peer>   // socketId → Peer
  createdAt: number
}

// ── State ────────────────────────────────────────────────
const rooms = new Map<string, Room>()

// ── Helpers ──────────────────────────────────────────────
function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      roomId,
      peers: new Map(),
      createdAt: Date.now(),
    })
  }
  return rooms.get(roomId)!
}

function getRoomPeerList(room: Room) {
  return Array.from(room.peers.values()).map(p => ({
    socketId: p.socketId,
    displayName: p.displayName,
  }))
}

function leaveAllRooms(socket: Socket) {
  rooms.forEach((room, roomId) => {
    if (room.peers.has(socket.id)) {
      room.peers.delete(socket.id)
      socket.to(roomId).emit('peer:left', { socketId: socket.id })
      console.log(`[${roomId}] ${socket.id} left (${room.peers.size} remaining)`)
      if (room.peers.size === 0) {
        rooms.delete(roomId)
        console.log(`[${roomId}] Room deleted (empty)`)
      }
    }
  })
}

// ── Socket Events ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`+ connected: ${socket.id}`)

  // ── Join Room ──────────────────────────────────────────
  // Client emits: { roomId, displayName }
  // Server responds: 'room:joined' with existing peers list
  // Server broadcasts: 'peer:joined' to others in room
  socket.on('room:join', ({ roomId, displayName }: { roomId: string; displayName: string }) => {
    if (!roomId || !displayName) return

    const room = getOrCreateRoom(roomId)

    if (room.peers.size >= 10) {
      socket.emit('room:full', { roomId })
      return
    }

    const peer: Peer = { socketId: socket.id, displayName, joinedAt: Date.now() }
    room.peers.set(socket.id, peer)
    socket.join(roomId)

    // Tell the joiner who is already here
    socket.emit('room:joined', {
      roomId,
      peers: getRoomPeerList(room).filter(p => p.socketId !== socket.id),
    })

    // Tell everyone else a new peer arrived
    socket.to(roomId).emit('peer:joined', {
      socketId: socket.id,
      displayName,
    })

    console.log(`[${roomId}] ${displayName} (${socket.id}) joined — ${room.peers.size} peers`)
  })

  // ── WebRTC Signaling: Offer ───────────────────────────
  // Client emits: { to: socketId, offer: RTCSessionDescriptionInit }
  socket.on('signal:offer', ({ to, offer }: { to: string; offer: RTCSessionDescriptionInit }) => {
    io.to(to).emit('signal:offer', { from: socket.id, offer })
  })

  // ── WebRTC Signaling: Answer ──────────────────────────
  // Client emits: { to: socketId, answer: RTCSessionDescriptionInit }
  socket.on('signal:answer', ({ to, answer }: { to: string; answer: RTCSessionDescriptionInit }) => {
    io.to(to).emit('signal:answer', { from: socket.id, answer })
  })

  // ── WebRTC Signaling: ICE Candidate ───────────────────
  // Client emits: { to: socketId, candidate: RTCIceCandidateInit }
  socket.on('signal:ice', ({ to, candidate }: { to: string; candidate: RTCIceCandidateInit }) => {
    io.to(to).emit('signal:ice', { from: socket.id, candidate })
  })

  // ── Peer media state broadcast ────────────────────────────
  // Client emits: { roomId, audioEnabled, videoEnabled }
  // Server broadcasts to everyone else in the room
  socket.on('peer:media-state', ({ roomId, audioEnabled, videoEnabled }: {
    roomId: string
    audioEnabled: boolean
    videoEnabled: boolean
  }) => {
    socket.to(roomId).emit('peer:media-state', {
      socketId: socket.id,
      audioEnabled,
      videoEnabled,
    })
  })

  // ── Leave Room ────────────────────────────────────────
  socket.on('room:leave', () => leaveAllRooms(socket))

  // ── Disconnect ────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(`- disconnected: ${socket.id} (${reason})`)
    leaveAllRooms(socket)
  })
})

// ── Health & Debug Routes ─────────────────────────────────
app.get('/health', (_: express.Request, res: express.Response) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.get('/debug/rooms', (_: express.Request, res: express.Response) => {
  const data = Array.from(rooms.values()).map(r => ({
    roomId: r.roomId,
    peerCount: r.peers.size,
    peers: Array.from(r.peers.values()).map(p => ({
      socketId: p.socketId,
      displayName: p.displayName,
    })),
    createdAt: new Date(r.createdAt).toISOString(),
  }))
  res.json(data)
})

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`SyncSpace signaling server ready on port ${PORT}`)
  console.log(`Health:  http://localhost:${PORT}/health`)
  console.log(`Debug:   http://localhost:${PORT}/debug/rooms`)
})
