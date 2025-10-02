import { type User, type InsertUser, type ServerConfig, type InsertServerConfig, type Bot, type InsertBot, type Log, type InsertLog, type ChatMessage, type InsertChatMessage, type AiConfig, type InsertAiConfig } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Server configuration
  getServerConfig(): Promise<ServerConfig>;
  updateServerConfig(config: InsertServerConfig): Promise<ServerConfig>;

  // Bot management
  getAllBots(): Promise<Bot[]>;
  getBot(id: string): Promise<Bot | undefined>;
  getBotByName(name: string): Promise<Bot | undefined>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: string, bot: Partial<InsertBot>): Promise<Bot>;
  deleteBot(id: string): Promise<void>;

  // Logs
  getLogs(limit?: number): Promise<Log[]>;
  addLog(log: InsertLog): Promise<Log>;
  clearLogs(): Promise<void>;

  // Chat messages
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // AI configuration
  getAiConfig(): Promise<AiConfig>;
  updateAiConfig(config: Partial<InsertAiConfig>): Promise<AiConfig>;

  // Session store
  sessionStore: ReturnType<typeof createMemoryStore>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private serverConfigs: Map<string, ServerConfig>;
  private botsMap: Map<string, Bot>;
  private botsByName: Map<string, Bot>;
  private logsArray: Log[];
  private chatMessagesArray: ChatMessage[];
  private aiConfigs: Map<string, AiConfig>;
  public sessionStore: ReturnType<typeof createMemoryStore>;

  constructor() {
    this.users = new Map();
    this.serverConfigs = new Map();
    this.botsMap = new Map();
    this.botsByName = new Map();
    this.logsArray = [];
    this.chatMessagesArray = [];
    this.aiConfigs = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    }) as any;

    // Initialize default configurations
    this.initializeDefaults();
  }

  private async initializeDefaults() {
    // Default server config
    const defaultServerConfig: ServerConfig = {
      id: randomUUID(),
      ip: "tbcraft.cbu.net",
      port: 25569,
      password: "12345678P",
      followTarget: "rabbit0009",
      autoReconnect: true,
      reconnectDelay: 30,
      autoRegister: false,
      autoLogin: false,
      updatedAt: new Date(),
    };
    this.serverConfigs.set("default", defaultServerConfig);

    // Default AI config
    const defaultAiConfig: AiConfig = {
      id: randomUUID(),
      model: "gpt-5",
      listenUser: "rabbit0009",
      enabled: true,
      autoResponse: true,
      totalRequests: 0,
      commandsParsed: 0,
      avgResponseTime: 0,
      successRate: 100,
      updatedAt: new Date(),
    };
    this.aiConfigs.set("default", defaultAiConfig);
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      role: insertUser.role || 'user',
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Server configuration
  async getServerConfig(): Promise<ServerConfig> {
    return this.serverConfigs.get("default")!;
  }

  async updateServerConfig(config: InsertServerConfig): Promise<ServerConfig> {
    const existing = this.serverConfigs.get("default")!;
    const updated: ServerConfig = {
      ...existing,
      ...config,
      updatedAt: new Date(),
    };
    this.serverConfigs.set("default", updated);
    return updated;
  }

  // Bot management
  async getAllBots(): Promise<Bot[]> {
    return Array.from(this.botsMap.values());
  }

  async getBot(id: string): Promise<Bot | undefined> {
    return this.botsMap.get(id);
  }

  async getBotByName(name: string): Promise<Bot | undefined> {
    return this.botsByName.get(name);
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const id = randomUUID();
    const bot: Bot = {
      ...insertBot,
      status: insertBot.status || 'offline',
      health: insertBot.health ?? null,
      position: insertBot.position ?? null,
      currentAction: insertBot.currentAction ?? null,
      uptime: insertBot.uptime ?? null,
      id,
      createdAt: new Date(),
      lastSeen: new Date(),
    };
    this.botsMap.set(id, bot);
    this.botsByName.set(bot.name, bot);
    return bot;
  }

  async updateBot(id: string, updates: Partial<InsertBot>): Promise<Bot> {
    const existing = this.botsMap.get(id);
    if (!existing) {
      throw new Error(`Bot with id ${id} not found`);
    }

    // Remove from name index if name is changing
    if (updates.name && updates.name !== existing.name) {
      this.botsByName.delete(existing.name);
    }

    const updated: Bot = {
      ...existing,
      ...updates,
      lastSeen: new Date(),
    };

    this.botsMap.set(id, updated);
    this.botsByName.set(updated.name, updated);
    return updated;
  }

  async deleteBot(id: string): Promise<void> {
    const bot = this.botsMap.get(id);
    if (bot) {
      this.botsMap.delete(id);
      this.botsByName.delete(bot.name);
    }
  }

  // Logs
  async getLogs(limit: number = 100): Promise<Log[]> {
    return this.logsArray.slice(-limit).reverse();
  }

  async addLog(insertLog: InsertLog): Promise<Log> {
    const id = randomUUID();
    const log: Log = {
      ...insertLog,
      botId: insertLog.botId ?? null,
      id,
      timestamp: new Date(),
    };
    this.logsArray.push(log);
    
    // Keep only last 1000 logs
    if (this.logsArray.length > 1000) {
      this.logsArray = this.logsArray.slice(-1000);
    }
    
    return log;
  }

  async clearLogs(): Promise<void> {
    this.logsArray = [];
  }

  // Chat messages
  async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    return this.chatMessagesArray.slice(-limit).reverse();
  }

  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      isBot: insertMessage.isBot || false,
      botId: insertMessage.botId ?? null,
      id,
      timestamp: new Date(),
    };
    this.chatMessagesArray.push(message);
    
    // Keep only last 500 messages
    if (this.chatMessagesArray.length > 500) {
      this.chatMessagesArray = this.chatMessagesArray.slice(-500);
    }
    
    return message;
  }

  // AI configuration
  async getAiConfig(): Promise<AiConfig> {
    return this.aiConfigs.get("default")!;
  }

  async updateAiConfig(updates: Partial<InsertAiConfig>): Promise<AiConfig> {
    const existing = this.aiConfigs.get("default")!;
    const updated: AiConfig = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.aiConfigs.set("default", updated);
    return updated;
  }
}

export const storage = new MemStorage();
