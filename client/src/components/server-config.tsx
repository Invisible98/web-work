import { useState } from "react";
import { ServerConfig as ServerConfigType, InsertServerConfig } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MinecraftButton } from "@/components/ui/minecraft-button";
import { StatusDot } from "@/components/ui/status-dot";
import { Server, Network, Key, Save, TestTube } from "lucide-react";

interface ServerConfigProps {
  config: ServerConfigType;
  onSave: (config: InsertServerConfig) => void;
  onTest?: () => void;
  isSaving?: boolean;
  isTesting?: boolean;
}

export function ServerConfigComponent({ config, onSave, onTest, isSaving = false, isTesting = false }: ServerConfigProps) {
  const [formData, setFormData] = useState<InsertServerConfig>({
    ip: config.ip,
    port: config.port,
    password: config.password,
    followTarget: config.followTarget,
    autoReconnect: config.autoReconnect,
    reconnectDelay: config.reconnectDelay,
    autoRegister: config.autoRegister,
    autoLogin: config.autoLogin,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (field: keyof InsertServerConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl">
      <Card className="glass-card border-primary" data-testid="server-config-form">
        <CardHeader>
          <CardTitle className="font-pixel text-lg">Server Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="server-ip" className="flex items-center gap-2 mb-2">
                <Server className="h-4 w-4 text-primary" />
                Server IP Address
              </Label>
              <Input
                id="server-ip"
                type="text"
                placeholder="tbcraft.cbu.net"
                value={formData.ip}
                onChange={(e) => handleInputChange('ip', e.target.value)}
                className="bg-muted border-border focus:border-primary font-mono"
                data-testid="input-server-ip"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the Minecraft server IP or hostname
              </p>
            </div>

            <div>
              <Label htmlFor="server-port" className="flex items-center gap-2 mb-2">
                <Network className="h-4 w-4 text-primary" />
                Server Port
              </Label>
              <Input
                id="server-port"
                type="number"
                placeholder="25565"
                value={formData.port}
                onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 25565)}
                className="bg-muted border-border focus:border-primary font-mono"
                data-testid="input-server-port"
                min="1"
                max="65535"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default Minecraft port is 25565
              </p>
            </div>

            <div>
              <Label htmlFor="bot-password" className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4 text-primary" />
                Bot Password
              </Label>
              <Input
                id="bot-password"
                type="password"
                placeholder="Enter bot login password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="bg-muted border-border focus:border-primary font-mono"
                data-testid="input-bot-password"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Password used for bot auto-registration and login
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h4 className="font-pixel text-sm mb-4">Connection Settings</h4>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="reconnect-delay" className="block text-sm font-medium mb-2">
                    Auto-Reconnect Delay (seconds)
                  </Label>
                  <Input
                    id="reconnect-delay"
                    type="number"
                    value={formData.reconnectDelay}
                    onChange={(e) => handleInputChange('reconnectDelay', parseInt(e.target.value) || 30)}
                    className="bg-muted border-border focus:border-primary font-mono"
                    data-testid="input-reconnect-delay"
                    min="1"
                    max="300"
                  />
                </div>

                <div>
                  <Label htmlFor="follow-target" className="block text-sm font-medium mb-2">
                    Default Follow Target
                  </Label>
                  <Input
                    id="follow-target"
                    type="text"
                    placeholder="rabbit0009"
                    value={formData.followTarget}
                    onChange={(e) => handleInputChange('followTarget', e.target.value)}
                    className="bg-muted border-border focus:border-primary font-mono"
                    data-testid="input-follow-target"
                    required
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Auto-Reconnect</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically reconnect bots on disconnect
                    </p>
                  </div>
                  <Switch
                    checked={formData.autoReconnect}
                    onCheckedChange={(checked) => handleInputChange('autoReconnect', checked)}
                    data-testid="switch-auto-reconnect"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoRegister">Auto Register</Label>
                    <p className="text-sm text-muted-foreground">
                      Send /register command when bot joins
                    </p>
                  </div>
                  <Switch
                    id="autoRegister"
                    checked={formData.autoRegister || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, autoRegister: checked })
                    }
                    data-testid="switch-auto-register"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoLogin">Auto Login</Label>
                    <p className="text-sm text-muted-foreground">
                      Send /login command when bot joins
                    </p>
                  </div>
                  <Switch
                    id="autoLogin"
                    checked={formData.autoLogin || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, autoLogin: checked })
                    }
                    data-testid="switch-auto-login"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <MinecraftButton
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isSaving}
                data-testid="button-save-config"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </MinecraftButton>
              {onTest && (
                <MinecraftButton
                  type="button"
                  variant="accent"
                  onClick={onTest}
                  disabled={isTesting}
                  data-testid="button-test-connection"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {isTesting ? 'Testing...' : 'Test'}
                </MinecraftButton>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card className="glass-card border-primary mt-6" data-testid="connection-status">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <StatusDot status="online" />
              <div>
                <p className="font-medium">Server Status</p>
                <p className="text-xs text-muted-foreground" data-testid="text-server-address">
                  {config.ip}:{config.port}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary" data-testid="text-server-ping">
                42ms
              </p>
              <p className="text-xs text-muted-foreground">Latency</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}