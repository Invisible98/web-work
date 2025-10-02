import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
  createdAt: timestamp("created_at").defaultNow(),
});

export const serverConfig = pgTable("server_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ip: text("ip").notNull().default("tbcraft.cbu.net"),
  port: integer("port").notNull().default(25569),
  password: text("password").notNull().default("12345678P"),
  followTarget: text("follow_target").notNull().default("rabbit0009"),
  autoReconnect: boolean("auto_reconnect").notNull().default(true),
  reconnectDelay: integer("reconnect_delay").notNull().default(30),
  autoRegister: boolean("auto_register").notNull().default(false),
  autoLogin: boolean("auto_login").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bots = pgTable("minecraft_bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  status: text("status").notNull().default("offline"), // "online", "offline", "connecting"
  health: integer("health").default(20),
  position: jsonb("position").$type<{ x: number; y: number; z: number }>(),
  currentAction: text("current_action").default("idle"),
  uptime: integer("uptime").default(0), // seconds
  isRegistered: boolean("is_registered").notNull().default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const logs = pgTable("bot_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  level: text("level").notNull(), // "info", "success", "warning", "error"
  message: text("message").notNull(),
  botId: varchar("bot_id"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  content: text("content").notNull(),
  isBot: boolean("is_bot").notNull().default(false),
  botId: varchar("bot_id"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const aiConfig = pgTable("ai_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  model: text("model").notNull().default("gpt-5"),
  listenUser: text("listen_user").notNull().default("rabbit0009"),
  enabled: boolean("enabled").notNull().default(true),
  autoResponse: boolean("auto_response").notNull().default(true),
  totalRequests: integer("total_requests").default(0),
  commandsParsed: integer("commands_parsed").default(0),
  avgResponseTime: integer("avg_response_time").default(0), // milliseconds
  successRate: integer("success_rate").default(100), // percentage
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertServerConfigSchema = createInsertSchema(serverConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertBotSchema = createInsertSchema(bots).omit({
  id: true,
  createdAt: true,
  lastSeen: true,
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  timestamp: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertAiConfigSchema = createInsertSchema(aiConfig).omit({
  id: true,
  updatedAt: true,
});

// Bot action schemas
export const botActionSchema = z.object({
  action: z.enum(["follow", "attack", "teleport", "stop", "antiafk", "command", "chat"]),
  target: z.string().optional(),
  botIds: z.array(z.string()).optional(), // if empty, applies to all
  customCommand: z.string().optional(),
});

export const serverStatsSchema = z.object({
  totalBots: z.number(),
  onlineBots: z.number(),
  offlineBots: z.number(),
  avgHealth: z.number(),
  avgUptime: z.number(),
  serverPing: z.number(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ServerConfig = typeof serverConfig.$inferSelect;
export type InsertServerConfig = z.infer<typeof insertServerConfigSchema>;
export type Bot = typeof bots.$inferSelect;
export type InsertBot = z.infer<typeof insertBotSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type AiConfig = typeof aiConfig.$inferSelect;
export type InsertAiConfig = z.infer<typeof insertAiConfigSchema>;
export type BotAction = z.infer<typeof botActionSchema>;
export type ServerStats = z.infer<typeof serverStatsSchema>;
