import { io } from 'socket.io-client';

/** Maximum participants per room (1 host + 3 guests). Enforced on the client. */
export const MAX_ROOM_PARTICIPANTS = 4;

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

/** Briefly joins a room to read occupancy, then leaves. Frontend-only capacity check. */
export function probeRoomCapacity(
  roomId: string,
  displayName: string,
): Promise<'ok' | 'full'> {
  return new Promise((resolve) => {
      const socket = io(SERVER_URL, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 8000,
      });

      const finish = (result: 'ok' | 'full') => {
        socket.emit('room:leave');
        socket.disconnect();
        resolve(result);
      };

      const timer = window.setTimeout(() => finish('full'), 8000);

      socket.on('connect', () => {
        socket.emit('room:join', { roomId, displayName });
      });

      socket.on('room:joined', ({ peers }: { peers: unknown[] }) => {
        window.clearTimeout(timer);
        finish(peers.length >= MAX_ROOM_PARTICIPANTS ? 'full' : 'ok');
      });

      socket.on('room:full', () => {
        window.clearTimeout(timer);
        finish('full');
      });

      socket.on('connect_error', () => {
        window.clearTimeout(timer);
        finish('ok');
      });
    });
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

export function formatRoomCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}
