import express, { Express, Request, Response } from 'express';
import { Server } from 'http';

export class MockHttpServer {
  private app: Express;
  private server?: Server;
  private port: number = 3000;
  private logs: any[] = [];

  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // POST /logs endpoint
    this.app.post('/logs', (req: Request, res: Response) => {
      console.log('Mock HTTP received log:', req.body);
      this.logs.push({
        timestamp: new Date().toISOString(),
        data: req.body,
      });
      res.status(200).json({ success: true, message: 'Log received' });
    });

    // GET /logs endpoint (for testing)
    this.app.get('/logs', (req: Request, res: Response) => {
      res.status(200).json({ logs: this.logs });
    });

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok' });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Mock HTTP server listening on port ${this.port}`);
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

      this.server.close(() => {
        console.log('Mock HTTP server closed');
        resolve();
      });
    });
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogs(): any[] {
    return this.logs;
  }

  getUrl(): string {
    return `http://localhost:${this.port}`;
  }
}
