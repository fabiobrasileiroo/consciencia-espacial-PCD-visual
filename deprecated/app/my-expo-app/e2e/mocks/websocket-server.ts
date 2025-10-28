import { WebSocket, Server as WebSocketServer } from 'ws';

export class MockWebSocketServer {
  private server?: WebSocketServer;
  private port: number = 8080;
  private clients: Set<WebSocket> = new Set();

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = new WebSocketServer({ port: this.port });

      this.server.on('connection', (ws: WebSocket) => {
        this.clients.add(ws);
        console.log(`Mock WS client connected. Total: ${this.clients.size}`);

        ws.on('close', () => {
          this.clients.delete(ws);
          console.log(`Mock WS client disconnected. Total: ${this.clients.size}`);
        });

        ws.on('message', (data: string) => {
          console.log('Mock WS received:', data);
        });
      });

      this.server.on('listening', () => {
        console.log(`Mock WebSocket server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      // Close all client connections
      this.clients.forEach(client => {
        client.close();
      });
      this.clients.clear();

      this.server.close(() => {
        console.log('Mock WebSocket server closed');
        resolve();
      });
    });
  }

  sendToAll(event: string, data: any): void {
    const message = JSON.stringify({ event, data });
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  simulateDisconnect(): void {
    this.clients.forEach(client => {
      client.close();
    });
    this.clients.clear();
  }

  getUrl(): string {
    return `ws://localhost:${this.port}/ws`;
  }
}
