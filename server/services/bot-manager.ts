import { EventEmitter } from 'events';
import mineflayer, { Bot as MineflayerBot } from 'mineflayer';
import { pathfinder, Movements } from 'mineflayer-pathfinder';
import { storage } from '../storage';
import { Bot, InsertBot, BotAction, ServerConfig } from '@shared/schema';

interface BotInstance {
  id: string;
  bot: MineflayerBot | null;
  reconnectTimer?: NodeJS.Timeout;
  antiAfkTimer?: NodeJS.Timeout;
  isConnecting: boolean;
  uptime: Date;
}

export class BotManager extends EventEmitter {
  private bots: Map<string, BotInstance> = new Map();
  private serverConfig!: ServerConfig;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    this.serverConfig = await storage.getServerConfig();

    // Load existing bots from storage
    const existingBots = await storage.getAllBots();
    for (const bot of existingBots) {
      this.bots.set(bot.id, {
        id: bot.id,
        bot: null,
        isConnecting: false,
        uptime: new Date(),
      });
    }
  }

  async updateServerConfig(config: ServerConfig) {
    this.serverConfig = config;
    // Reconnect all bots with new config
    await this.reconnectAllBots();
  }

  async spawnBot(customName?: string): Promise<Bot> {
    const name = customName || `CraftBot_${Math.floor(Math.random() * 10000)}`;

    // Check if bot name already exists
    const existing = await storage.getBotByName(name);
    if (existing) {
      throw new Error(`Bot with name ${name} already exists`);
    }

    const botData: InsertBot = {
      name,
      status: 'offline',
      health: 20,
      position: { x: 0, y: 0, z: 0 },
      currentAction: 'idle',
      uptime: 0,
    };

    const bot = await storage.createBot(botData);

    const botInstance: BotInstance = {
      id: bot.id,
      bot: null,
      isConnecting: false,
      uptime: new Date(),
    };

    this.bots.set(bot.id, botInstance);

    this.emit('bot-created', bot);
    await this.addLog('success', `Bot ${name} created`);

    return bot;
  }

  async spawnMultipleBots(count: number): Promise<Bot[]> {
    const bots: Bot[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const bot = await this.spawnBot();
        bots.push(bot);
      } catch (error: any) {
        await this.addLog('error', `Failed to spawn bot ${i + 1}: ${error?.message || 'Unknown error'}`);
      }
    }

    return bots;
  }

  async connectBot(botId: string): Promise<void> {
    const botInstance = this.bots.get(botId);
    if (!botInstance) {
      throw new Error(`Bot ${botId} not found`);
    }

    if (botInstance.isConnecting || botInstance.bot) {
      return; // Already connecting or connected
    }

    botInstance.isConnecting = true;
    await storage.updateBot(botId, { status: 'connecting' });

    const botData = await storage.getBot(botId);
    if (!botData) return;

    try {
      const bot = mineflayer.createBot({
        host: this.serverConfig.ip,
        port: this.serverConfig.port,
        username: botData.name,
        auth: 'offline',
        version: '1.21.4',
      });

      // Load pathfinder plugin
      bot.loadPlugin(pathfinder);

      botInstance.bot = bot;
      botInstance.uptime = new Date();

      this.setupBotEventHandlers(botId, bot);

      await this.addLog('info', `${botData.name} connecting to ${this.serverConfig.ip}:${this.serverConfig.port}`);

    } catch (error: any) {
      botInstance.isConnecting = false;
      await storage.updateBot(botId, { status: 'offline' });
      await this.addLog('error', `Failed to connect ${botData.name}: ${error?.message || 'Unknown error'}`);

      if (this.serverConfig.autoReconnect) {
        this.scheduleReconnect(botId);
      }
    }
  }

  private setupBotEventHandlers(botId: string, bot: MineflayerBot) {
    const botInstance = this.bots.get(botId);
    if (!botInstance) return;

    bot.on('spawn', async () => {
      botInstance.isConnecting = false;
      const position = bot.entity?.position;

      await storage.updateBot(botId, {
        status: 'online',
        health: bot.health,
        position: position ? { x: Math.floor(position.x), y: Math.floor(position.y), z: Math.floor(position.z) } : undefined,
        currentAction: 'idle',
      });

      const botData = await storage.getBot(botId);
      await this.addLog('success', `${botData?.name} connected and spawned`);

      // Auto login/register
      if (botData) {
        setTimeout(async () => {
          try {
            if (botData.isRegistered) {
              bot.chat(`/login ${this.serverConfig.password}`);
              await this.addLog('info', `${botData.name} executing /login`);
            } else {
              bot.chat(`/register ${this.serverConfig.password} ${this.serverConfig.password}`);
              await this.addLog('info', `${botData.name} executing /register`);
              await storage.updateBot(botId, { isRegistered: true });
            }
          } catch (error: any) {
            await this.addLog('error', `${botData.name} auto-login failed: ${error?.message || 'Unknown error'}`);
          }
        }, 1000);
      }

      this.emit('bot-connected', botId);
    });

    bot.on('health', async () => {
      await storage.updateBot(botId, { health: bot.health });
    });

    bot.on('move', async () => {
      const position = bot.entity?.position;
      if (position) {
        await storage.updateBot(botId, {
          position: { x: Math.floor(position.x), y: Math.floor(position.y), z: Math.floor(position.z) }
        });
      }
    });

    bot.on('chat', async (username, message) => {
      try {
        if (username === bot.username) return; // Ignore own messages

        // Store chat message
        await storage.addChatMessage({
          username,
          content: message,
          isBot: false,
        });

        this.emit('chat-message', { username, message, botId });
      } catch (error: any) {
        console.error('Chat event error:', error);
      }
    });

    bot.on('error', async (err) => {
      console.error('Bot error:', err);
      await this.addLog('error', `${bot.username} error: ${err.message}`);
      this.handleBotDisconnect(botId, 'error');
    });

    bot.on('end', async (reason) => {
      await this.addLog('warning', `${bot.username} disconnected: ${reason}`);
      this.handleBotDisconnect(botId, 'disconnected');
    });

    bot.on('kicked', async (reason) => {
      await this.addLog('error', `${bot.username} kicked: ${reason}`);
      this.handleBotDisconnect(botId, 'kicked');
    });
  }

  private async handleBotDisconnect(botId: string, reason: string) {
    const botInstance = this.bots.get(botId);
    if (!botInstance) return;

    botInstance.bot = null;
    botInstance.isConnecting = false;

    // Clear timers
    if (botInstance.reconnectTimer) {
      clearTimeout(botInstance.reconnectTimer);
    }
    if (botInstance.antiAfkTimer) {
      clearInterval(botInstance.antiAfkTimer);
    }

    await storage.updateBot(botId, {
      status: 'offline',
      currentAction: 'disconnected',
    });

    this.emit('bot-disconnected', botId);

    if (this.serverConfig.autoReconnect) {
      this.scheduleReconnect(botId);
    }
  }

  private scheduleReconnect(botId: string) {
    const botInstance = this.bots.get(botId);
    if (!botInstance) return;

    botInstance.reconnectTimer = setTimeout(() => {
      this.connectBot(botId);
    }, this.serverConfig.reconnectDelay * 1000);
  }

  async disconnectBot(botId: string): Promise<void> {
    const botInstance = this.bots.get(botId);
    if (!botInstance) return;

    // Clear timers
    if (botInstance.reconnectTimer) {
      clearTimeout(botInstance.reconnectTimer);
    }
    if (botInstance.antiAfkTimer) {
      clearInterval(botInstance.antiAfkTimer);
    }

    if (botInstance.bot) {
      botInstance.bot.quit();
      botInstance.bot = null;
    }

    await storage.updateBot(botId, {
      status: 'offline',
      currentAction: 'idle',
    });

    const botData = await storage.getBot(botId);
    await this.addLog('info', `${botData?.name} disconnected`);
  }

  async deleteBot(botId: string): Promise<void> {
    await this.disconnectBot(botId);

    const botData = await storage.getBot(botId);
    await storage.deleteBot(botId);
    this.bots.delete(botId);

    await this.addLog('info', `Bot ${botData?.name} deleted`);
    this.emit('bot-deleted', botId);
  }

  async executeAction(action: BotAction): Promise<void> {
    const targetBots = action.botIds?.length
      ? action.botIds
      : Array.from(this.bots.keys());

    for (const botId of targetBots) {
      await this.executeBotAction(botId, action);
    }
  }

  private async executeBotAction(botId: string, action: BotAction): Promise<void> {
    const botInstance = this.bots.get(botId);
    const botData = await storage.getBot(botId);

    if (!botInstance?.bot || !botData) {
      await this.addLog('warning', `Cannot execute action on ${botData?.name || botId}: bot not connected`);
      return;
    }

    const bot = botInstance.bot;

    try {
      switch (action.action) {
        case 'follow':
          await this.followPlayer(bot, action.target || this.serverConfig.followTarget);
          await storage.updateBot(botId, { currentAction: `Following ${action.target || this.serverConfig.followTarget}` });
          break;

        case 'attack':
          if (action.target) {
            await this.attackPlayer(bot, action.target);
            await storage.updateBot(botId, { currentAction: `Attacking ${action.target}` });
          }
          break;

        case 'teleport':
          await this.teleportToPlayer(bot, action.target || this.serverConfig.followTarget);
          await storage.updateBot(botId, { currentAction: 'Teleporting' });
          break;

        case 'stop':
          await this.stopBotAction(bot);
          await storage.updateBot(botId, { currentAction: 'idle' });
          break;

        case 'antiafk':
          await this.enableAntiAfk(botId, bot);
          await storage.updateBot(botId, { currentAction: 'Anti-AFK' });
          break;

        case 'command':
          if (action.customCommand) {
            await this.executeCommand(bot, action.customCommand);
          }
          break;

        case 'chat':
          if (action.customCommand) {
            await this.sendChat(bot, action.customCommand);
          }
          break;
      }

      await this.addLog('success', `${botData.name}: ${action.action} executed`);
    } catch (error: any) {
      await this.addLog('error', `${botData.name}: Failed to execute ${action.action}: ${error?.message || 'Unknown error'}`);
    }
  }

  private async followPlayer(bot: MineflayerBot, playerName: string): Promise<void> {
    const player = bot.players[playerName];
    if (!player || !player.entity) {
      throw new Error(`Player ${playerName} not found`);
    }

    const { goals } = require('mineflayer-pathfinder');
    const movements = new Movements(bot);
    bot.pathfinder.setMovements(movements);
    bot.pathfinder.setGoal(new goals.GoalFollow(player.entity, 3));
  }

  private async attackPlayer(bot: MineflayerBot, playerName: string): Promise<void> {
    const player = bot.players[playerName];
    if (!player || !player.entity) {
      throw new Error(`Player ${playerName} not found`);
    }

    await bot.attack(player.entity);
  }

  private async teleportToPlayer(bot: MineflayerBot, playerName: string): Promise<void> {
    bot.chat(`/tp ${playerName}`);
  }

  private async stopBotAction(bot: MineflayerBot): Promise<void> {
    bot.pathfinder.setGoal(null);
    bot.clearControlStates();
  }

  private async enableAntiAfk(botId: string, bot: MineflayerBot): Promise<void> {
    const botInstance = this.bots.get(botId);
    if (!botInstance) return;

    // Clear existing timer
    if (botInstance.antiAfkTimer) {
      clearInterval(botInstance.antiAfkTimer);
    }

    // Jump every minute
    botInstance.antiAfkTimer = setInterval(() => {
      if (bot && bot.entity) {
        bot.setControlState('jump', true);
        setTimeout(() => {
          if (bot) bot.setControlState('jump', false);
        }, 100);
      }
    }, 60000);
  }

  private async executeCommand(bot: MineflayerBot, command: string): Promise<void> {
    if (command.startsWith('/')) {
      bot.chat(command);
    } else {
      // Try to execute as a direct command
      bot.chat(`/${command}`);
    }
  }

  private async sendChat(bot: MineflayerBot, message: string): Promise<void> {
    bot.chat(message);

    // Store the sent message
    await storage.addChatMessage({
      username: bot.username,
      content: message,
      isBot: true,
      botId: this.bots.get(bot.username)?.id,
    });
  }

  async connectAllBots(): Promise<void> {
    const allBots = await storage.getAllBots();

    for (const bot of allBots) {
      try {
        await this.connectBot(bot.id);
      } catch (error: any) {
        await this.addLog('error', `Failed to connect ${bot.name}: ${error?.message || 'Unknown error'}`);
      }
    }
  }

  async disconnectAllBots(): Promise<void> {
    const botIds = Array.from(this.bots.keys());

    for (const botId of botIds) {
      await this.disconnectBot(botId);
    }
  }

  async reconnectAllBots(): Promise<void> {
    await this.disconnectAllBots();

    // Wait a moment before reconnecting
    setTimeout(() => {
      this.connectAllBots();
    }, 2000);
  }

  async getServerStats() {
    const allBots = await storage.getAllBots();
    const onlineBots = allBots.filter(bot => bot.status === 'online');

    const totalHealth = onlineBots.reduce((sum, bot) => sum + (bot.health || 0), 0);
    const avgHealth = onlineBots.length > 0 ? totalHealth / onlineBots.length : 0;

    // Calculate average uptime in hours
    const now = new Date();
    const totalUptime = Array.from(this.bots.values()).reduce((sum, instance) => {
      if (instance.bot) {
        return sum + (now.getTime() - instance.uptime.getTime());
      }
      return sum;
    }, 0);
    const avgUptime = onlineBots.length > 0 ? totalUptime / onlineBots.length / (1000 * 60 * 60) : 0;

    return {
      totalBots: allBots.length,
      onlineBots: onlineBots.length,
      offlineBots: allBots.length - onlineBots.length,
      avgHealth: Math.round(avgHealth * 10) / 10,
      avgUptime: Math.round(avgUptime * 10) / 10,
      serverPing: 42, // TODO: Implement actual ping measurement
    };
  }

  private async addLog(level: 'info' | 'success' | 'warning' | 'error', message: string, botId?: string): Promise<void> {
    await storage.addLog({ level, message, botId });
    this.emit('log-added', { level, message, botId, timestamp: new Date() });
  }

  async getAllBots(): Promise<Bot[]> {
    return storage.getAllBots();
  }

  async getBot(id: string): Promise<Bot | undefined> {
    return storage.getBot(id);
  }
}