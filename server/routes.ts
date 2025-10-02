import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { BotManager } from "./services/bot-manager";
import { OpenAIService } from "./services/openai-service";
import { WebSocketManager } from "./websocket";
import { botActionSchema, insertServerConfigSchema, insertAiConfigSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  const httpServer = createServer(app);

  // Initialize services
  const botManager = new BotManager();
  const openaiService = new OpenAIService();
  const wsManager = new WebSocketManager(httpServer);

  // Setup bot manager event listeners
  botManager.on('bot-created', async (bot) => {
    const allBots = await botManager.getAllBots();
    wsManager.broadcastBotUpdate(allBots);
  });

  botManager.on('bot-connected', async (botId) => {
    const allBots = await botManager.getAllBots();
    wsManager.broadcastBotUpdate(allBots);

    const stats = await botManager.getServerStats();
    wsManager.broadcastServerStats(stats);
  });

  botManager.on('bot-disconnected', async (botId) => {
    const allBots = await botManager.getAllBots();
    wsManager.broadcastBotUpdate(allBots);

    const stats = await botManager.getServerStats();
    wsManager.broadcastServerStats(stats);
  });

  botManager.on('bot-deleted', async (botId) => {
    const allBots = await botManager.getAllBots();
    wsManager.broadcastBotUpdate(allBots);
  });

  botManager.on('log-added', (log) => {
    wsManager.broadcastLogUpdate(log);
  });

  botManager.on('chat-message', async ({ username, message, botId }) => {
    // Check if this is a command from the AI listen user
    const aiAction = await openaiService.parseCommand(username, message);

    if (aiAction) {
      if (aiAction.action === 'chat') {
        // This is a chat response, send it back
        const responseMessage = aiAction.customCommand;
        if (responseMessage) {
          // Find an online bot to send the response
          const bots = await botManager.getAllBots();
          const onlineBot = bots.find(bot => bot.status === 'online');

          if (onlineBot) {
            await botManager.executeAction({
              action: 'chat',
              customCommand: responseMessage,
              botIds: [onlineBot.id],
            });
          }
        }
      } else {
        // Execute the bot action
        await botManager.executeAction(aiAction);

        // Generate and send a response if auto-response is enabled
        const aiConfig = await storage.getAiConfig();
        if (aiConfig.autoResponse) {
          const response = await openaiService.generateResponse(aiAction.action, aiAction.target);
          if (response) {
            const bots = await botManager.getAllBots();
            const onlineBot = bots.find(bot => bot.status === 'online');

            if (onlineBot) {
              await botManager.executeAction({
                action: 'chat',
                customCommand: response,
                botIds: [onlineBot.id],
              });
            }
          }
        }
      }
    }

    wsManager.broadcastChatMessage({ username, message, botId, timestamp: new Date() });
  });

  // Bot management routes
  app.get("/api/bots", async (req, res) => {
    try {
      const bots = await botManager.getAllBots();
      res.json(bots);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  app.post("/api/bots", async (req, res) => {
    try {
      const { name } = req.body;
      const bot = await botManager.spawnBot(name);
      res.status(201).json(bot);
    } catch (error: any) {
      res.status(400).json({ message: error?.message || 'Unknown error' });
    }
  });

  app.post("/api/bots/spawn-multiple", async (req, res) => {
    try {
      const { count = 10 } = req.body;
      const bots = await botManager.spawnMultipleBots(count);
      res.json(bots);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  app.post("/api/bots/:id/connect", async (req, res) => {
    try {
      await botManager.connectBot(req.params.id);
      res.sendStatus(200);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  app.post("/api/bots/:id/disconnect", async (req, res) => {
    try {
      await botManager.disconnectBot(req.params.id);
      res.sendStatus(200);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  app.patch("/api/bots/:id/rename", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Name is required" });
      }
      await botManager.renameBot(req.params.id, name);
      res.sendStatus(200);
    } catch (error: any) {
      res.status(400).json({ message: error?.message || 'Unknown error' });
    }
  });

  app.delete("/api/bots/:id", async (req, res) => {
    try {
      await botManager.deleteBot(req.params.id);
      res.sendStatus(200);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  app.post("/api/bots/connect-all", async (req, res) => {
    try {
      await botManager.connectAllBots();
      res.sendStatus(200);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  app.post("/api/bots/disconnect-all", async (req, res) => {
    try {
      await botManager.disconnectAllBots();
      res.sendStatus(200);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  // Bot actions
  app.post("/api/bots/action", async (req, res) => {
    try {
      const action = botActionSchema.parse(req.body);
      await botManager.executeAction(action);
      res.sendStatus(200);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid action format", errors: error.errors });
      } else {
        res.status(500).json({ message: error?.message || 'Unknown error' });
      }
    }
  });

  // Server configuration
  app.get("/api/server-config", async (req, res) => {
    try {
      const config = await storage.getServerConfig();
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  app.post("/api/server-config", async (req, res) => {
    try {
      const configData = insertServerConfigSchema.parse(req.body);
      const config = await storage.updateServerConfig(configData);
      await botManager.updateServerConfig(config);
      wsManager.broadcastServerConfigUpdate(config);
      res.json(config);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid config format", errors: error.errors });
      } else {
        res.status(500).json({ message: error?.message || 'Unknown error' });
      }
    }
  });

  // Server stats
  app.get("/api/server-stats", async (req, res) => {
    try {
      const stats = await botManager.getServerStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  // Logs
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getLogs(limit);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  app.delete("/api/logs", async (req, res) => {
    try {
      await storage.clearLogs();
      res.sendStatus(200);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  // Chat messages
  app.get("/api/chat", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const messages = await storage.getChatMessages(limit);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  // AI configuration
  app.get("/api/ai-config", async (req, res) => {
    try {
      const config = await storage.getAiConfig();
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || 'Unknown error' });
    }
  });

  app.post("/api/ai-config", async (req, res) => {
    try {
      const configData = insertAiConfigSchema.parse(req.body);
      const config = await storage.updateAiConfig(configData);
      wsManager.broadcastAiConfigUpdate(config);
      res.json(config);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid AI config format", errors: error.errors });
      } else {
        res.status(500).json({ message: error?.message || 'Unknown error' });
      }
    }
  });

  // Broadcast server stats periodically
  setInterval(async () => {
    try {
      const stats = await botManager.getServerStats();
      wsManager.broadcastServerStats(stats);
    } catch (error) {
      console.error('Error broadcasting server stats:', error);
    }
  }, 5000); // Every 5 seconds

  return httpServer;
}