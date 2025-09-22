export class WebSocketManager {
  private ws: WebSocket | null = null;

  /* open the native WS the server already provides */
  connect(clientId: string): WebSocket {
    this.ws = new WebSocket(`ws://localhost:8000/ws/${clientId}`);
    return this.ws;
  }

  /* send JSON messages */
  emit(event: string, payload: any) {
    this.ws?.send(JSON.stringify({ type: event, ...payload }));
  }

  /* tidy-up */
  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const wsManager = new WebSocketManager();