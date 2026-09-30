import { Response } from 'express';

interface SseClient {
  id: string;
  topic: string;
  res: Response;
}

class SseManager {
  private clients: Map<string, SseClient> = new Map();

  constructor() {
    // Keep-alive heartbeat every 25 seconds
    setInterval(() => {
      this.sendHeartbeat();
    }, 25000);
  }

  public addClient(topic: string, res: Response): string {
    const clientId = `${topic}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', clientId, topic })}\n\n`);

    const client: SseClient = { id: clientId, topic, res };
    this.clients.set(clientId, client);

    res.on('close', () => {
      this.clients.delete(clientId);
    });

    return clientId;
  }

  public broadcast(topic: string, event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const [, client] of this.clients) {
      if (client.topic === topic || client.topic === 'all') {
        try {
          client.res.write(payload);
        } catch {
          this.clients.delete(client.id);
        }
      }
    }
  }

  public broadcastQueueUpdate(serviceId: string, data: unknown): void {
    this.broadcast(`queue_${serviceId}`, 'queue_update', data);
    this.broadcast('all_queues', 'queue_update', data);
  }

  public broadcastTokenUpdate(tokenId: string, data: unknown): void {
    this.broadcast(`token_${tokenId}`, 'token_update', data);
  }

  public broadcastNotification(userId: string, data: unknown): void {
    this.broadcast(`user_${userId}`, 'notification', data);
  }

  private sendHeartbeat(): void {
    const comment = ': heartbeat\n\n';
    for (const [id, client] of this.clients) {
      try {
        client.res.write(comment);
      } catch {
        this.clients.delete(id);
      }
    }
  }
}

export const sseManager = new SseManager();
