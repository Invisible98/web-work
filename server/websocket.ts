import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws' 
    });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      console.log('WebSocket client connected');

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('WebSocket client disconnected');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send initial data
      this.sendInitialData(ws);
    });
  }

  private async sendInitialData(ws: WebSocket) {
    try {
      // Send current bots
      const bots = await storage.getAllBots();
      this.sendToClient(ws, {
        type: 'bots-update',
        data: bots
      });

      // Send recent logs
      const logs = await storage.getLogs(50);
      this.sendToClient(ws, {
        type: 'logs-update',
        data: logs
      });

      // Send recent chat messages
      const chatMessages = await storage.getChatMessages(50);
      this.sendToClient(ws, {
        type: 'chat-update',
        data: chatMessages
      });

      // Send server config
      const serverConfig = await storage.getServerConfig();
      this.sendToClient(ws, {
        type: 'server-config-update',
        data: serverConfig
      });

      // Send AI config
      const aiConfig = await storage.getAiConfig();
      this.sendToClient(ws, {
        type: 'ai-config-update',
        data: aiConfig
      });

    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  private sendToClient(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  broadcastBotUpdate(bots: any[]) {
    this.broadcast({
      type: 'bots-update',
      data: bots
    });
  }

  broadcastLogUpdate(log: any) {
    this.broadcast({
      type: 'log-added',
      data: log
    });
  }

  broadcastChatMessage(message: any) {
    this.broadcast({
      type: 'chat-message',
      data: message
    });
  }

  broadcastServerStats(stats: any) {
    this.broadcast({
      type: 'server-stats',
      data: stats
    });
  }

  broadcastServerConfigUpdate(config: any) {
    this.broadcast({
      type: 'server-config-update',
      data: config
    });
  }

  broadcastAiConfigUpdate(config: any) {
    this.broadcast({
      type: 'ai-config-update',
      data: config
    });
  }
}
