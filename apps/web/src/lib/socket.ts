import { io, type Socket } from 'socket.io-client';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

export function connectTrackingSocket(token: string): Socket {
  return io(`${WS_BASE}/tracking`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
}
