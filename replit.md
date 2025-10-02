# Minecraft Bot Manager

## Overview

A full-stack web application for managing multiple Minecraft bots with real-time control, AI-powered chat commands, and a responsive dashboard. The application enables spawning, controlling, and monitoring Minecraft bots that connect to a server, with features like player following, attacking, anti-AFK modes, and OpenAI GPT-5 integration for natural language command parsing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, built with Vite for fast development and optimized production builds.

**UI Components**: Leverages shadcn/ui component library built on Radix UI primitives, providing accessible and customizable components. The design follows a dark theme with Minecraft-inspired aesthetics using a custom "pixel" font (Press Start 2P) and glassmorphic card styles.

**Styling**: TailwindCSS with custom CSS variables for theming. Uses a color scheme optimized for dark mode with primary green, destructive red, and accent yellow colors reminiscent of Minecraft.

**State Management**: 
- TanStack Query (React Query) for server state management with custom query client configuration
- Local React state for UI interactions
- WebSocket integration for real-time updates

**Routing**: Wouter for lightweight client-side routing with protected routes requiring authentication.

**Real-time Communication**: Custom WebSocket hook (`use-websocket`) that automatically reconnects and provides typed message handling for bot updates, logs, and server statistics.

**Responsive Design**: Mobile-first approach with custom `use-mobile` hook detecting viewport size. Tab-based navigation for mobile devices.

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js.

**Architecture Pattern**: Service-oriented architecture with clear separation of concerns:
- `BotManager` service: Handles all Minecraft bot lifecycle operations using the Mineflayer library
- `OpenAIService`: Manages AI command parsing and response generation
- `WebSocketManager`: Manages real-time bidirectional communication with clients

**API Design**: RESTful endpoints under `/api` namespace with consistent error handling and response formatting.

**Authentication**: 
- Passport.js with Local Strategy for username/password authentication
- Session-based authentication using express-session
- Password hashing using Node.js native scrypt with salt
- Role-based access control (admin/user roles)

**Real-time Events**: EventEmitter pattern for internal service communication (bot-created, bot-connected, bot-disconnected, log-added events).

**Bot Management**: 
- Mineflayer library for Minecraft protocol implementation
- Pathfinder plugin for navigation and movement
- Auto-reconnection logic with configurable delays
- Support for multiple simultaneous bot instances

### Data Storage

**ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations and migrations.

**Database**: Configured for PostgreSQL (Neon serverless), with connection pooling via `@neondatabase/serverless`.

**Schema Design**:
- `users`: User accounts with roles (admin/user)
- `server_config`: Global server connection settings (IP, port, password, follow target)
- `minecraft_bots`: Bot instances with status, health, position, action, and uptime tracking
- `bot_logs`: Timestamped log entries with severity levels
- `chat_messages`: Chat history with bot/player identification
- `ai_config`: OpenAI integration settings (model, target user, auto-response)

**Session Storage**: PostgreSQL-backed session store using `connect-pg-simple` for production, with in-memory fallback for development.

**Fallback Strategy**: Comprehensive in-memory storage implementation (`MemStorage`) that mirrors the database interface, allowing the application to run without database connectivity.

### External Dependencies

**Minecraft Integration**:
- `mineflayer`: Core library for creating Minecraft bots
- `mineflayer-pathfinder`: Navigation and pathfinding capabilities
- Target server: tbcraft.cbu.net:25569 (configurable)
- Auto-registration and authentication with predefined credentials

**AI Integration**:
- OpenAI API (GPT-5 model) for natural language command parsing
- Listens for specific player messages (default: rabbit0009)
- Parses commands: attack, follow, stop, teleport, status
- Generates contextual responses for chat interaction

**Build & Development**:
- Vite for frontend bundling and HMR
- esbuild for backend bundling in production
- TypeScript compilation with strict mode
- Custom Vite plugins for Replit integration (runtime error overlay, cartographer, dev banner)

**WebSocket**: `ws` library for WebSocket server implementation with custom message type system.

**Session Management**: Express-session with PostgreSQL store for persistent sessions across server restarts.

**UI Libraries**: Extensive use of Radix UI primitives wrapped in custom components for consistent design system.

**Date Handling**: date-fns for date formatting and manipulation.

**Form Validation**: React Hook Form with Zod resolvers for type-safe form validation using Drizzle-generated Zod schemas.