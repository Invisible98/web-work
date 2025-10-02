import OpenAI from 'openai';
import { storage } from '../storage';
import { BotAction } from '@shared/schema';

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class OpenAIService {
  private requestStartTime: number = 0;

  async parseCommand(username: string, message: string): Promise<BotAction | null> {
    const aiConfig = await storage.getAiConfig();
    
    if (!aiConfig.enabled || username !== aiConfig.listenUser) {
      return null;
    }

    this.requestStartTime = Date.now();

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a Minecraft bot command parser. Parse the user's message and extract bot commands.
            
Available commands:
- "attack [player]" - Attack a specific player
- "follow [player]" - Follow a specific player (default: rabbit0009)
- "stop" - Stop current action
- "teleport" - Teleport to rabbit0009
- "status" - Get bot status (no action needed, just respond)

If the message contains a valid command, respond with JSON in this format:
{
  "action": "follow|attack|teleport|stop|chat",
  "target": "player_name_if_applicable",
  "customCommand": "text_if_chat_response",
  "shouldRespond": true/false
}

If it's just casual conversation or status request, respond with:
{
  "shouldRespond": true,
  "customCommand": "your_friendly_response"
}

If no valid command is found, respond with:
{
  "shouldRespond": false
}`
          },
          {
            role: "user",
            content: message
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Update AI stats
      await this.updateAiStats(true);
      
      if (result.action && result.action !== 'chat') {
        // Increment commands parsed
        await storage.updateAiConfig({ 
          commandsParsed: (aiConfig.commandsParsed || 0) + 1 
        });
        
        return {
          action: result.action,
          target: result.target,
          customCommand: result.customCommand,
        };
      } else if (result.shouldRespond && result.customCommand) {
        // This is a chat response, not a bot action
        return {
          action: 'chat',
          customCommand: result.customCommand,
        };
      }
      
      return null;
      
    } catch (error) {
      await this.updateAiStats(false);
      console.error('OpenAI API error:', error);
      
      // Return a simple fallback response
      if (message.toLowerCase().includes('status')) {
        return {
          action: 'chat',
          customCommand: 'All bots are running normally!',
        };
      }
      
      return null;
    }
  }

  async generateResponse(command: string, context?: string): Promise<string> {
    const aiConfig = await storage.getAiConfig();
    
    if (!aiConfig.autoResponse) {
      return '';
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a helpful Minecraft bot assistant. Respond briefly and friendly to commands and interactions. 
            Keep responses short (1-2 sentences max) and in character as a Minecraft bot.
            
            Examples:
            - For attack commands: "Attacking [player] now!"
            - For follow commands: "Following [player]!"
            - For stop commands: "Stopping all actions."
            - For teleport: "Teleporting now!"
            - For general chat: Be friendly and helpful but brief.`
          },
          {
            role: "user",
            content: `Command executed: ${command}. ${context ? `Context: ${context}` : ''}`
          }
        ],
        max_completion_tokens: 100,
      });

      return response.choices[0].message.content || '';
      
    } catch (error) {
      console.error('OpenAI response generation error:', error);
      return 'Command executed!';
    }
  }

  private async updateAiStats(success: boolean): Promise<void> {
    const aiConfig = await storage.getAiConfig();
    const responseTime = Date.now() - this.requestStartTime;
    
    const totalRequests = aiConfig.totalRequests || 0;
    const avgResponseTime = aiConfig.avgResponseTime || 0;
    const successRate = aiConfig.successRate || 100;
    
    const newTotal = totalRequests + 1;
    const newAvgResponse = Math.round(
      (avgResponseTime * totalRequests + responseTime) / newTotal
    );
    
    let newSuccessRate = successRate;
    if (success) {
      // Calculate new success rate
      const successfulRequests = Math.round((successRate / 100) * totalRequests) + 1;
      newSuccessRate = Math.round((successfulRequests / newTotal) * 100);
    } else {
      const successfulRequests = Math.round((successRate / 100) * totalRequests);
      newSuccessRate = Math.round((successfulRequests / newTotal) * 100);
    }

    await storage.updateAiConfig({
      totalRequests: newTotal,
      avgResponseTime: newAvgResponse,
      successRate: newSuccessRate,
    });
  }
}
