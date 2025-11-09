// Re-export from api.ts to maintain backward compatibility
import { api } from './api';

export const MODEL = 'claude-sonnet-4-5-20250929';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export type TextContent = {
  type: 'text';
  text: string;
};

export type MessageResponse = {
  content: TextContent[];
  role: string;
};

// Call backend API with authentication
export const anthropic = {
  messages: {
    create: async (params: {
      model: string;
      max_tokens: number;
      system: string;
      messages: Message[];
    }): Promise<MessageResponse> => {
      return api.sendChatMessage(params.messages, params.system);
    },
  },
};
