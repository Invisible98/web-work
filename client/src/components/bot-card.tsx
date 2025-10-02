import { Bot } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { MinecraftButton } from "@/components/ui/minecraft-button";
import { StatusDot } from "@/components/ui/status-dot";
import { Trash2, Plug, Power, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface BotCardProps {
  bot: Bot;
  onConnect?: (botId: string) => void;
  onDisconnect?: (botId: string) => void;
  onDelete?: (botId: string) => void;
  onRename?: (botId: string, newName: string) => void;
  isAdmin?: boolean;
}

export function BotCard({ bot, onConnect, onDisconnect, onDelete, onRename, isAdmin = false }: BotCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(bot.name);
  const formatUptime = (uptimeSeconds: number) => {
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatPosition = (position: { x: number; y: number; z: number } | null) => {
    if (!position) return "--";
    return `X:${position.x} Y:${position.y} Z:${position.z}`;
  };

  const handleRename = () => {
    if (onRename && newName.trim() && newName !== bot.name) {
      onRename(bot.id, newName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelRename = () => {
    setNewName(bot.name);
    setIsEditing(false);
  };

  return (
    <Card className="glass-card border-muted hover:border-primary transition-colors" data-testid={`card-bot-${bot.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <StatusDot status={bot.status as "online" | "offline" | "connecting"} />
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center space-x-1">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-7 text-sm px-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename();
                      if (e.key === 'Escape') handleCancelRename();
                    }}
                    autoFocus
                  />
                  <MinecraftButton
                    variant="primary"
                    size="sm"
                    onClick={handleRename}
                    className="p-1 h-7"
                  >
                    <Check className="h-3 w-3" />
                  </MinecraftButton>
                  <MinecraftButton
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelRename}
                    className="p-1 h-7"
                  >
                    <X className="h-3 w-3" />
                  </MinecraftButton>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-sm truncate" data-testid={`text-bot-name-${bot.id}`}>
                    {bot.name}
                  </h4>
                  {isAdmin && onRename && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground capitalize" data-testid={`text-bot-status-${bot.id}`}>
                {bot.status}
              </p>
            </div>
          </div>
          {isAdmin && onDelete && !isEditing && (
            <MinecraftButton
              variant="destructive"
              size="sm"
              onClick={() => onDelete(bot.id)}
              className="p-2 h-auto"
              data-testid={`button-delete-bot-${bot.id}`}
            >
              <Trash2 className="h-3 w-3" />
            </MinecraftButton>
          )}
        </div>

        <div className="space-y-2 text-xs mb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Health:</span>
            <span className="font-medium" data-testid={`text-bot-health-${bot.id}`}>
              {bot.health ? `${bot.health}/20` : "--"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Position:</span>
            <span className="font-mono text-xs" data-testid={`text-bot-position-${bot.id}`}>
              {formatPosition(bot.position)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uptime:</span>
            <span data-testid={`text-bot-uptime-${bot.id}`}>
              {bot.uptime ? formatUptime(bot.uptime) : "--"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Action:</span>
            <span 
              className={cn(
                "font-medium",
                bot.status === "online" ? "text-primary" : 
                bot.status === "connecting" ? "text-accent" : "text-destructive"
              )}
              data-testid={`text-bot-action-${bot.id}`}
            >
              {bot.currentAction || "idle"}
            </span>
          </div>
        </div>

        {isAdmin && (onConnect || onDisconnect) && (
          <div className="grid grid-cols-2 gap-2">
            {onConnect && (
              <MinecraftButton
                variant="primary"
                size="sm"
                onClick={() => onConnect(bot.id)}
                disabled={bot.status === "online" || bot.status === "connecting"}
                data-testid={`button-connect-bot-${bot.id}`}
              >
                <Plug className="h-3 w-3" />
              </MinecraftButton>
            )}
            {onDisconnect && (
              <MinecraftButton
                variant="destructive"
                size="sm"
                onClick={() => onDisconnect(bot.id)}
                disabled={bot.status === "offline"}
                data-testid={`button-disconnect-bot-${bot.id}`}
              >
                <Power className="h-3 w-3" />
              </MinecraftButton>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
