import { io, Socket } from 'socket.io-client';

export class WebSocketManager {
  private socket: Socket | null = null;
  private url: string;

  constructor(url: string = 'ws://localhost:8000') {
    this.url = url;
  }

  connect(clientId: string) {
    this.socket = io(this.url, {
      transports: ['websocket'],
      query: { clientId }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export const wsManager = new WebSocketManager();