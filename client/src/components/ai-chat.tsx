import { useState } from "react";
import { ChatMessage, AiConfig, InsertAiConfig } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MinecraftButton } from "@/components/ui/minecraft-button";
import { Brain, Save, List, BarChart3, User, Bot } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AiChatProps {
  chatMessages: ChatMessage[];
  aiConfig: AiConfig;
  onSaveConfig: (config: Partial<InsertAiConfig>) => void;
  isSaving?: boolean;
}

export function AiChat({ chatMessages, aiConfig, onSaveConfig, isSaving = false }: AiChatProps) {
  const [formData, setFormData] = useState<Partial<InsertAiConfig>>({
    model: aiConfig.model,
    listenUser: aiConfig.listenUser,
    enabled: aiConfig.enabled,
    autoResponse: aiConfig.autoResponse,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
  };

  const handleInputChange = (field: keyof InsertAiConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const supportedCommands = [
    { command: "attack", description: "[player]" },
    { command: "follow", description: "[player]" },
    { command: "stop", description: "" },
    { command: "teleport", description: "" },
    { command: "status", description: "" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chat Log */}
      <div className="lg:col-span-2">
        <Card className="glass-card border-primary" data-testid="ai-chat-log">
          <CardHeader className="p-4 border-b border-border">
            <CardTitle className="font-pixel text-sm">Chat History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px] p-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No chat messages yet
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-3" data-testid={`chat-message-${message.id}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        message.isBot ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'
                      }`}>
                        {message.isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-bold text-sm" data-testid={`chat-username-${message.id}`}>
                            {message.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp!)}
                          </span>
                        </div>
                        <p className={`text-sm p-3 rounded-lg ${
                          message.isBot 
                            ? 'bg-accent/20 border border-accent' 
                            : 'bg-muted'
                        }`} data-testid={`chat-content-${message.id}`}>
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardHeader className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
              <Bot className="h-3 w-3" />
              AI listens to messages from {aiConfig.listenUser} and responds automatically
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* AI Configuration */}
      <div className="space-y-6">
        <Card className="glass-card border-accent" data-testid="ai-config-form">
          <CardHeader>
            <CardTitle className="font-pixel text-sm text-accent flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="ai-model" className="block text-sm font-medium mb-2">
                  OpenAI Model
                </Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => handleInputChange('model', value)}
                >
                  <SelectTrigger className="bg-muted border-border focus:border-accent" data-testid="select-ai-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-5">GPT-5</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="listen-user" className="block text-sm font-medium mb-2">
                  Listen to User
                </Label>
                <Input
                  id="listen-user"
                  type="text"
                  value={formData.listenUser}
                  onChange={(e) => handleInputChange('listenUser', e.target.value)}
                  className="bg-muted border-border focus:border-accent font-mono"
                  data-testid="input-listen-user"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm font-medium">AI Enabled</Label>
                  <p className="text-xs text-muted-foreground">Parse commands</p>
                </div>
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => handleInputChange('enabled', checked)}
                  data-testid="switch-ai-enabled"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Auto-Response</Label>
                  <p className="text-xs text-muted-foreground">Send replies to chat</p>
                </div>
                <Switch
                  checked={formData.autoResponse}
                  onCheckedChange={(checked) => handleInputChange('autoResponse', checked)}
                  data-testid="switch-auto-response"
                />
              </div>

              <MinecraftButton
                type="submit"
                variant="accent"
                className="w-full"
                disabled={isSaving}
                data-testid="button-save-ai-config"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </MinecraftButton>
            </form>
          </CardContent>
        </Card>

        {/* Supported Commands */}
        <Card className="glass-card border-secondary" data-testid="supported-commands">
          <CardHeader>
            <CardTitle className="font-pixel text-sm flex items-center gap-2">
              <List className="h-4 w-4" />
              Commands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              {supportedCommands.map((cmd) => (
                <div
                  key={cmd.command}
                  className="p-2 bg-muted rounded font-mono"
                  data-testid={`command-${cmd.command}`}
                >
                  <span className="text-accent font-bold">{cmd.command}</span>
                  {cmd.description && <span className="text-muted-foreground"> {cmd.description}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Stats */}
        <Card className="glass-card border-primary" data-testid="ai-stats">
          <CardHeader>
            <CardTitle className="font-pixel text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              AI Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Requests:</span>
                <span className="font-bold" data-testid="stat-total-requests">
                  {aiConfig.totalRequests}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commands Parsed:</span>
                <span className="font-bold" data-testid="stat-commands-parsed">
                  {aiConfig.commandsParsed}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Response:</span>
                <span className="font-bold" data-testid="stat-avg-response">
                  {aiConfig.avgResponseTime}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Success Rate:</span>
                <span className="font-bold text-primary" data-testid="stat-success-rate">
                  {aiConfig.successRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
