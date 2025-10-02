import { useEffect, useRef, useState } from "react";
import { Log } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MinecraftButton } from "@/components/ui/minecraft-button";
import { Trash2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogViewerProps {
  logs: Log[];
  onClearLogs?: () => void;
  isAdmin?: boolean;
}

export function LogViewer({ logs, onClearLogs, isAdmin = false }: LogViewerProps) {
  const [isPaused, setIsPaused] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getLogLevelClass = (level: string) => {
    const classes = {
      info: "border-l-blue-500 text-blue-300",
      success: "border-l-primary text-green-300",
      warning: "border-l-accent text-yellow-300",
      error: "border-l-destructive text-red-300",
    };
    return classes[level as keyof typeof classes] || classes.info;
  };

  return (
    <Card className="glass-card border-secondary" data-testid="log-viewer">
      <CardHeader className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="font-pixel text-sm">Live Logs</CardTitle>
          {isAdmin && (
            <div className="flex items-center space-x-2">
              {onClearLogs && (
                <MinecraftButton
                  variant="destructive"
                  size="sm"
                  onClick={onClearLogs}
                  data-testid="button-clear-logs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </MinecraftButton>
              )}
              <MinecraftButton
                variant="secondary"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                data-testid="button-pause-logs"
              >
                {isPaused ? (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </>
                )}
              </MinecraftButton>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={logContainerRef}
          className="p-4 bg-black/50 max-h-96 overflow-y-auto font-mono text-xs space-y-1"
          data-testid="log-container"
        >
          {logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No logs available
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  "log-entry p-2 border-l-3 pl-3",
                  getLogLevelClass(log.level)
                )}
                data-testid={`log-entry-${log.id}`}
              >
                <span className="text-muted-foreground mr-2">
                  [{formatTime(log.timestamp!)}]
                </span>
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}