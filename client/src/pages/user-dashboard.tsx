import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { Bot, Log, ServerStats } from "@shared/schema";

// Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MinecraftButton } from "@/components/ui/minecraft-button";
import { StatusDot } from "@/components/ui/status-dot";
import { BotCard } from "@/components/bot-card";
import { LogViewer } from "@/components/log-viewer";

// Icons
import { 
  Box, LogOut, LayoutDashboard, Bot as BotIcon, Terminal,
  Info, CheckCircle, Clock, Server
} from "lucide-react";

export default function UserDashboard() {
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [activeView, setActiveView] = useState("dashboard");

  // Redirect admin users to admin panel
  if (user && user.role === "admin") {
    return <Redirect to="/admin" />;
  }

  // WebSocket connection
  const { isConnected, onMessage } = useWebSocket();

  // State for real-time data
  const [bots, setBots] = useState<Bot[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
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

    onMessage('server-stats', (data: ServerStats) => {
      setServerStats(data);
    });
  }, [onMessage]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Mobile navigation items
  const mobileNavItems = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "bots", label: "Bots", icon: BotIcon },
    { id: "logs", label: "Logs", icon: Terminal },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="gradient-header sticky top-0 z-50 shadow-lg" data-testid="user-header">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Box className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-pixel text-lg text-primary">Bot Manager</h1>
              <p className="text-xs text-muted-foreground">User Panel</p>
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
                <Server className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium" data-testid="server-status">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3 border-l border-border pl-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium" data-testid="user-username">{user.username}</p>
                <p className="text-xs text-secondary">User</p>
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
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {/* Info Banner */}
        <Card className="glass-card border-accent mb-6" data-testid="info-banner">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <h3 className="font-bold mb-1">View-Only Access</h3>
                <p className="text-sm text-muted-foreground">
                  You have read-only access. Contact an administrator for full bot control.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LayoutDashboard View */}
        {activeView === "dashboard" && (
          <div data-testid="user-dashboard-section">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="glass-card border-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <BotIcon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-1" data-testid="stat-total-bots">
                    {serverStats.totalBots}
                  </h3>
                  <p className="text-xs text-muted-foreground">Total Bots</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-1" data-testid="stat-online-bots-card">
                    {serverStats.onlineBots}
                  </h3>
                  <p className="text-xs text-muted-foreground">Online</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-accent">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold mb-1" data-testid="stat-avg-uptime">
                    {serverStats.avgUptime}h
                  </h3>
                  <p className="text-xs text-muted-foreground">Avg Uptime</p>
                </CardContent>
              </Card>

              <Card className="glass-card border-secondary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Server className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-1 text-primary" data-testid="stat-server-ping">
                    {serverStats.serverPing}ms
                  </h3>
                  <p className="text-xs text-muted-foreground">Latency</p>
                </CardContent>
              </Card>
            </div>

            {/* Bot List */}
            <div className="mb-6">
              <h3 className="font-pixel text-lg mb-4">Bot Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bots.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No bots available
                  </div>
                ) : (
                  bots.map((bot) => (
                    <BotCard
                      key={bot.id}
                      bot={bot}
                      isAdmin={false}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity Log */}
            <LogViewer logs={logs.slice(0, 20)} isAdmin={false} />
          </div>
        )}

        {/* Bots View */}
        {activeView === "bots" && (
          <div data-testid="user-bots-section">
            <div className="mb-6">
              <h2 className="font-pixel text-xl mb-2">Bot Status</h2>
              <p className="text-muted-foreground">View current bot information and status</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bots.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No bots available
                </div>
              ) : (
                bots.map((bot) => (
                  <BotCard
                    key={bot.id}
                    bot={bot}
                    isAdmin={false}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Logs View */}
        {activeView === "logs" && (
          <div data-testid="user-logs-section">
            <div className="mb-6">
              <h2 className="font-pixel text-xl mb-2">Recent Activity</h2>
              <p className="text-muted-foreground">Monitor bot activities and system events</p>
            </div>

            <LogViewer logs={logs} isAdmin={false} />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40" data-testid="mobile-nav">
          <div className="grid grid-cols-3 gap-1 p-2">
            {mobileNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex flex-col items-center justify-center py-2 ${
                  activeView === item.id ? "text-primary" : "text-muted-foreground"
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
