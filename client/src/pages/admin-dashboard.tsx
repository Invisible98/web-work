import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Bot, Log, ChatMessage, ServerConfig, AiConfig, ServerStats, BotAction } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MinecraftButton } from "@/components/ui/minecraft-button";
import { StatusDot } from "@/components/ui/status-dot";
import { BotCard } from "@/components/bot-card";
import { LogViewer } from "@/components/log-viewer";
import { ServerConfigComponent } from "@/components/server-config";
import { AiChat } from "@/components/ai-chat";

// Icons
import { 
  Box, LogOut, LayoutDashboard, Bot as BotIcon, Sliders, Terminal, 
  Settings, MessageSquare, Plus, StopCircle, RefreshCw, 
  User, Sword, MapPin, Play, MessageCircle, Send,
  Server, Heart, Clock, Brain
} from "lucide-react";

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedBot, setSelectedBot] = useState<string>("all");
  const [customCommand, setCustomCommand] = useState("");

  // Redirect non-admin users
  if (user && user.role !== "admin") {
    return <Redirect to="/user" />;
  }

  // WebSocket connection
  const { isConnected, onMessage } = useWebSocket();

  // State for real-time data
  const [bots, setBots] = useState<Bot[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [serverStats, setServerStats] = useState<ServerStats>({
    totalBots: 0,
    onlineBots: 0,
    offlineBots: 0,
    avgHealth: 0,
    avgUptime: 0,
    serverPing: 0,
  });

  // Query for initial data
  const { data: initialBots } = useQuery<Bot[]>({
    queryKey: ["/api/bots"],
    enabled: !!user,
  });

  const { data: initialLogs } = useQuery<Log[]>({
    queryKey: ["/api/logs"],
    enabled: !!user,
  });

  const { data: initialChatMessages } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat"],
    enabled: !!user,
  });

  const { data: serverConfig } = useQuery<ServerConfig>({
    queryKey: ["/api/server-config"],
    enabled: !!user,
  });

  const { data: aiConfig } = useQuery<AiConfig>({
    queryKey: ["/api/ai-config"],
    enabled: !!user,
  });

  const { data: initialStats } = useQuery<ServerStats>({
    queryKey: ["/api/server-stats"],
    enabled: !!user,
  });

  // Initialize state from query data
  useEffect(() => {
    if (initialBots) setBots(initialBots);
  }, [initialBots]);

  useEffect(() => {
    if (initialLogs) setLogs(initialLogs);
  }, [initialLogs]);

  useEffect(() => {
    if (initialChatMessages) setChatMessages(initialChatMessages);
  }, [initialChatMessages]);

  useEffect(() => {
    if (initialStats) setServerStats(initialStats);
  }, [initialStats]);

  // WebSocket event handlers
  useEffect(() => {
    onMessage('bots-update', (data: Bot[]) => {
      setBots(data);
    });

    onMessage('log-added', (data: Log) => {
      setLogs(prev => [data, ...prev].slice(0, 100));
    });

    onMessage('chat-message', (data: ChatMessage) => {
      setChatMessages(prev => [data, ...prev].slice(0, 50));
    });

    onMessage('server-stats', (data: ServerStats) => {
      setServerStats(data);
    });

    onMessage('server-config-update', () => {
      queryClient.invalidateQueries({ queryKey: ["/api/server-config"] });
    });

    onMessage('ai-config-update', () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-config"] });
    });
  }, [onMessage]);

  // Mutations
  const spawnBotMutation = useMutation({
    mutationFn: async (name?: string) => {
      const res = await apiRequest("POST", "/api/bots", name ? { name } : {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Bot spawned successfully", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to spawn bot", description: error.message, variant: "destructive" });
    },
  });

  const spawnMultipleBotsMutation = useMutation({
    mutationFn: async (count: number) => {
      const res = await apiRequest("POST", "/api/bots/spawn-multiple", { count });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Bots spawned successfully", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to spawn bots", description: error.message, variant: "destructive" });
    },
  });

  const connectBotMutation = useMutation({
    mutationFn: async (botId: string) => {
      await apiRequest("POST", `/api/bots/${botId}/connect`);
    },
    onSuccess: () => {
      toast({ title: "Bot connection initiated", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to connect bot", description: error.message, variant: "destructive" });
    },
  });

  const disconnectBotMutation = useMutation({
    mutationFn: async (botId: string) => {
      await apiRequest("POST", `/api/bots/${botId}/disconnect`);
    },
    onSuccess: () => {
      toast({ title: "Bot disconnected", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to disconnect bot", description: error.message, variant: "destructive" });
    },
  });

  const deleteBotMutation = useMutation({
    mutationFn: async (botId: string) => {
      await apiRequest("DELETE", `/api/bots/${botId}`);
    },
    onSuccess: () => {
      toast({ title: "Bot deleted", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete bot", description: error.message, variant: "destructive" });
    },
  });

  const connectAllBotsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/bots/connect-all");
    },
    onSuccess: () => {
      toast({ title: "Connecting all bots", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to connect all bots", description: error.message, variant: "destructive" });
    },
  });

  const disconnectAllBotsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/bots/disconnect-all");
    },
    onSuccess: () => {
      toast({ title: "Disconnecting all bots", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to disconnect all bots", description: error.message, variant: "destructive" });
    },
  });

  const botActionMutation = useMutation({
    mutationFn: async (action: BotAction) => {
      await apiRequest("POST", "/api/bots/action", action);
    },
    onSuccess: () => {
      toast({ title: "Action executed", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to execute action", description: error.message, variant: "destructive" });
    },
  });

  const updateServerConfigMutation = useMutation({
    mutationFn: async (config: any) => {
      const res = await apiRequest("POST", "/api/server-config", config);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Server configuration saved", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save configuration", description: error.message, variant: "destructive" });
    },
  });

  const updateAiConfigMutation = useMutation({
    mutationFn: async (config: any) => {
      const res = await apiRequest("POST", "/api/ai-config", config);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "AI configuration saved", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to save AI configuration", description: error.message, variant: "destructive" });
    },
  });

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/logs");
    },
    onSuccess: () => {
      setLogs([]);
      toast({ title: "Logs cleared", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to clear logs", description: error.message, variant: "destructive" });
    },
  });

  // Action handlers
  const handleBotAction = (action: string, target?: string) => {
    const botIds = selectedBot === "all" ? undefined : [selectedBot];
    
    botActionMutation.mutate({
      action: action as any,
      target,
      botIds,
      customCommand: action === "command" || action === "chat" ? customCommand : undefined,
    });

    if (action === "command" || action === "chat") {
      setCustomCommand("");
    }
  };

  const handleCustomCommand = () => {
    if (!customCommand.trim()) return;
    
    const action = customCommand.startsWith("/") ? "command" : "chat";
    handleBotAction(action);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Desktop sidebar navigation items
  const sidebarItems = [
    { id: "dashboard", label: "LayoutDashboard", icon: LayoutDashboard },
    { id: "bots", label: "Bots", icon: BotIcon },
    { id: "controls", label: "Global Controls", icon: Sliders },
    { id: "logs", label: "Logs", icon: Terminal },
    { id: "server-config", label: "Server Config", icon: Settings },
    { id: "ai-chat", label: "AI Chat", icon: MessageSquare },
  ];

  // Mobile navigation items
  const mobileNavItems = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "bots", label: "Bots", icon: BotIcon },
    { id: "controls", label: "Control", icon: Sliders },
    { id: "logs", label: "Logs", icon: Terminal },
    { id: "more", label: "More", icon: Settings },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="gradient-header sticky top-0 z-50 shadow-lg" data-testid="admin-header">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Box className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-pixel text-lg text-primary">Bot Manager</h1>
              <p className="text-xs text-muted-foreground">Administrator Panel</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Real-time Stats */}
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <StatusDot status="online" />
                <span data-testid="stat-online-bots">{serverStats.onlineBots}</span>
                <span className="text-muted-foreground">Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <StatusDot status="offline" />
                <span data-testid="stat-offline-bots">{serverStats.offlineBots}</span>
                <span className="text-muted-foreground">Offline</span>
              </div>
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium" data-testid="server-status">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3 border-l border-border pl-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium" data-testid="admin-username">{user.username}</p>
                <p className="text-xs text-primary">Administrator</p>
              </div>
              <MinecraftButton
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </MinecraftButton>
            </div>
          </div>
        </div>

        {/* Mobile Stats Bar */}
        <div className="md:hidden border-t border-border px-4 py-2 flex justify-around text-xs">
          <div className="flex items-center space-x-1">
            <StatusDot status="online" />
            <span>{serverStats.onlineBots}</span>
          </div>
          <div className="flex items-center space-x-1">
            <StatusDot status="offline" />
            <span>{serverStats.offlineBots}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Server className="h-3 w-3 text-primary" />
            <span className="text-primary">{isConnected ? "OK" : "ERR"}</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="w-64 bg-card border-r border-border min-h-screen sticky top-[120px] overflow-y-auto">
            <nav className="p-4 space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium flex items-center space-x-3 transition-colors ${
                    activeView === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Quick Actions */}
            <div className="p-4 border-t border-border">
              <h3 className="font-pixel text-xs mb-4 text-primary">Quick Actions</h3>
              <div className="space-y-2">
                <MinecraftButton
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => spawnMultipleBotsMutation.mutate(10)}
                  disabled={spawnMultipleBotsMutation.isPending}
                  data-testid="button-spawn-10"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Spawn 10
                </MinecraftButton>
                <MinecraftButton
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => disconnectAllBotsMutation.mutate()}
                  disabled={disconnectAllBotsMutation.isPending}
                  data-testid="button-stop-all"
                >
                  <StopCircle className="h-3 w-3 mr-2" />
                  Stop All
                </MinecraftButton>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto pb-24 md:pb-6">
          {/* LayoutDashboard View */}
          {activeView === "dashboard" && (
            <section data-testid="dashboard-section">
              <div className="mb-6">
                <h2 className="font-pixel text-xl mb-2">LayoutDashboard</h2>
                <p className="text-muted-foreground">Monitor and control all your Minecraft bots</p>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="glass-card border-primary">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <BotIcon className="h-8 w-8 text-primary" />
                      <StatusDot status="online" />
                    </div>
                    <h3 className="text-3xl font-bold mb-1" data-testid="stat-total-bots">
                      {serverStats.totalBots}
                    </h3>
                    <p className="text-sm text-muted-foreground">Total Bots</p>
                  </CardContent>
                </Card>

                <Card className="glass-card border-primary">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Heart className="h-8 w-8 text-destructive" />
                      <span className="text-sm text-muted-foreground">AVG</span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" data-testid="stat-avg-health">
                      {serverStats.avgHealth}
                    </h3>
                    <p className="text-sm text-muted-foreground">Average Health</p>
                  </CardContent>
                </Card>

                <Card className="glass-card border-accent">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="h-8 w-8 text-accent" />
                      <span className="text-sm text-muted-foreground">HRS</span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" data-testid="stat-avg-uptime">
                      {serverStats.avgUptime}
                    </h3>
                    <p className="text-sm text-muted-foreground">Avg Uptime</p>
                  </CardContent>
                </Card>

                <Card className="glass-card border-secondary">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Brain className="h-8 w-8 text-secondary" />
                      <span className="text-sm text-muted-foreground">AI</span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" data-testid="stat-ai-requests">
                      {aiConfig?.totalRequests || 0}
                    </h3>
                    <p className="text-sm text-muted-foreground">AI Requests</p>
                  </CardContent>
                </Card>
              </div>

              {/* Bot Grid */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-pixel text-lg">Active Bots</h3>
                  <MinecraftButton
                    variant="secondary"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/bots"] })}
                    data-testid="button-refresh-bots"
                  >
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Refresh
                  </MinecraftButton>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {bots.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No bots available. Spawn some bots to get started.
                    </div>
                  ) : (
                    bots.map((bot) => (
                      <BotCard
                        key={bot.id}
                        bot={bot}
                        onConnect={(botId) => connectBotMutation.mutate(botId)}
                        onDisconnect={(botId) => disconnectBotMutation.mutate(botId)}
                        onDelete={(botId) => deleteBotMutation.mutate(botId)}
                        isAdmin={true}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Bot Control Panel */}
              <Card className="glass-card border-primary mb-6">
                <CardHeader>
                  <CardTitle className="font-pixel text-lg">Bot Control Panel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Label htmlFor="bot-select" className="block text-sm font-medium mb-2">
                      Select Bot
                    </Label>
                    <Select value={selectedBot} onValueChange={setSelectedBot}>
                      <SelectTrigger className="bg-muted border-border focus:border-primary" data-testid="select-bot">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Bots</SelectItem>
                        {bots.map((bot) => (
                          <SelectItem key={bot.id} value={bot.id}>
                            {bot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <MinecraftButton
                      variant="primary"
                      onClick={() => handleBotAction("follow", serverConfig?.followTarget)}
                      data-testid="button-follow"
                    >
                      <User className="h-3 w-3 mr-2" />
                      Follow
                    </MinecraftButton>
                    <MinecraftButton
                      variant="destructive"
                      onClick={() => handleBotAction("attack")}
                      data-testid="button-attack"
                    >
                      <Sword className="h-3 w-3 mr-2" />
                      Attack
                    </MinecraftButton>
                    <MinecraftButton
                      variant="accent"
                      onClick={() => handleBotAction("antiafk")}
                      data-testid="button-antiafk"
                    >
                      <Play className="h-3 w-3 mr-2" />
                      Anti-AFK
                    </MinecraftButton>
                    <MinecraftButton
                      variant="secondary"
                      onClick={() => handleBotAction("stop")}
                      data-testid="button-stop"
                    >
                      <StopCircle className="h-3 w-3 mr-2" />
                      Stop
                    </MinecraftButton>
                    <MinecraftButton
                      variant="primary"
                      onClick={() => handleBotAction("teleport", serverConfig?.followTarget)}
                      data-testid="button-teleport"
                    >
                      <MapPin className="h-3 w-3 mr-2" />
                      Teleport
                    </MinecraftButton>
                    <MinecraftButton
                      variant="secondary"
                      onClick={() => handleBotAction("command")}
                      data-testid="button-command"
                    >
                      <Terminal className="h-3 w-3 mr-2" />
                      Command
                    </MinecraftButton>
                    <MinecraftButton
                      variant="accent"
                      onClick={() => handleBotAction("chat")}
                      data-testid="button-chat"
                    >
                      <MessageCircle className="h-3 w-3 mr-2" />
                      Chat
                    </MinecraftButton>
                    <MinecraftButton
                      variant="primary"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/bots"] })}
                      data-testid="button-refresh"
                    >
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Refresh
                    </MinecraftButton>
                  </div>

                  <div>
                    <Label htmlFor="custom-command" className="block text-sm font-medium mb-2">
                      Custom Command
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id="custom-command"
                        type="text"
                        placeholder="/tp rabbit0009 or chat message..."
                        value={customCommand}
                        onChange={(e) => setCustomCommand(e.target.value)}
                        className="flex-1 bg-muted border-border focus:border-primary font-mono text-sm"
                        data-testid="input-custom-command"
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomCommand()}
                      />
                      <MinecraftButton
                        variant="primary"
                        onClick={handleCustomCommand}
                        disabled={!customCommand.trim()}
                        data-testid="button-execute-command"
                      >
                        <Send className="h-4 w-4" />
                      </MinecraftButton>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Logs */}
              <LogViewer 
                logs={logs} 
                onClearLogs={() => clearLogsMutation.mutate()}
                isAdmin={true}
              />
            </section>
          )}

          {/* Other Views */}
          {activeView === "bots" && (
            <section data-testid="bots-section">
              <div className="mb-6">
                <h2 className="font-pixel text-xl mb-2">Bot Management</h2>
                <p className="text-muted-foreground">Manage individual bot instances</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bots.map((bot) => (
                  <BotCard
                    key={bot.id}
                    bot={bot}
                    onConnect={(botId) => connectBotMutation.mutate(botId)}
                    onDisconnect={(botId) => disconnectBotMutation.mutate(botId)}
                    onDelete={(botId) => deleteBotMutation.mutate(botId)}
                    isAdmin={true}
                  />
                ))}
              </div>
            </section>
          )}

          {activeView === "controls" && (
            <section data-testid="controls-section">
              <div className="mb-6">
                <h2 className="font-pixel text-xl mb-2">Global Controls</h2>
                <p className="text-muted-foreground">Control all bots simultaneously</p>
              </div>

              <div className="grid gap-4">
                <Card className="glass-card border-primary">
                  <CardHeader>
                    <CardTitle>Spawn Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MinecraftButton
                      variant="primary"
                      onClick={() => spawnMultipleBotsMutation.mutate(10)}
                      disabled={spawnMultipleBotsMutation.isPending}
                      data-testid="button-spawn-10-bots"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Spawn 10 Bots
                    </MinecraftButton>
                    <MinecraftButton
                      variant="primary"
                      onClick={() => spawnBotMutation.mutate(undefined)}
                      disabled={spawnBotMutation.isPending}
                      data-testid="button-spawn-single-bot"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Spawn Single Bot
                    </MinecraftButton>
                  </CardContent>
                </Card>

                <Card className="glass-card border-secondary">
                  <CardHeader>
                    <CardTitle>Connection Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MinecraftButton
                      variant="primary"
                      onClick={() => connectAllBotsMutation.mutate()}
                      disabled={connectAllBotsMutation.isPending}
                      data-testid="button-connect-all-bots"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Connect All Bots
                    </MinecraftButton>
                    <MinecraftButton
                      variant="destructive"
                      onClick={() => disconnectAllBotsMutation.mutate()}
                      disabled={disconnectAllBotsMutation.isPending}
                      data-testid="button-disconnect-all-bots"
                    >
                      <StopCircle className="h-4 w-4 mr-2" />
                      Disconnect All Bots
                    </MinecraftButton>
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          {activeView === "logs" && (
            <section data-testid="logs-section">
              <div className="mb-6">
                <h2 className="font-pixel text-xl mb-2">System Logs</h2>
                <p className="text-muted-foreground">Monitor bot activities and system events</p>
              </div>

              <LogViewer 
                logs={logs} 
                onClearLogs={() => clearLogsMutation.mutate()}
                isAdmin={true}
              />
            </section>
          )}

          {activeView === "server-config" && serverConfig && (
            <section data-testid="server-config-section">
              <div className="mb-6">
                <h2 className="font-pixel text-xl mb-2">Server Configuration</h2>
                <p className="text-muted-foreground">Configure Minecraft server connection settings</p>
              </div>

              <ServerConfigComponent
                config={serverConfig}
                onSave={(config) => updateServerConfigMutation.mutate(config)}
                isSaving={updateServerConfigMutation.isPending}
              />
            </section>
          )}

          {activeView === "ai-chat" && aiConfig && (
            <section data-testid="ai-chat-section">
              <div className="mb-6">
                <h2 className="font-pixel text-xl mb-2">AI Chat Integration</h2>
                <p className="text-muted-foreground">Monitor and configure OpenAI GPT-5 chat commands</p>
              </div>

              <AiChat
                chatMessages={chatMessages}
                aiConfig={aiConfig}
                onSaveConfig={(config) => updateAiConfigMutation.mutate(config)}
                isSaving={updateAiConfigMutation.isPending}
              />
            </section>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40" data-testid="mobile-nav">
          <div className="grid grid-cols-5 gap-1 p-2">
            {mobileNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id === "more" ? "server-config" : item.id)}
                className={`flex flex-col items-center justify-center py-2 ${
                  activeView === item.id || (item.id === "more" && (activeView === "server-config" || activeView === "ai-chat"))
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
                data-testid={`mobile-nav-${item.id}`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-pixel">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
