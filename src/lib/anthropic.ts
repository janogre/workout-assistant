// Backend API URL - defaults to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

// Call backend API instead of Anthropic directly
export const anthropic = {
  messages: {
    create: async (params: {
      model: string;
      max_tokens: number;
      system: string;
      messages: Message[];
    }): Promise<MessageResponse> => {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: params.messages,
          system: params.system,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return response.json();
    },
  },
};
