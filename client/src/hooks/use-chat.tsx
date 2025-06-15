import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatResponse {
  message: {
    role: string;
    content: string;
  };
  timestamp: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const sendMessage = useCallback(async (content: string, context?: string) => {
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          context
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message.content,
        timestamp: data.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);
      return assistantMessage;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send message';
      setError(errorMessage);
      
      toast({
        title: 'Chat Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const sendStreamingMessage = useCallback(async (
    content: string, 
    context?: string,
    onChunk?: (chunk: string) => void
  ) => {
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    // Prepare assistant message
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          message: content,
          context
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                
                // Update the last message with accumulated content
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    content: fullContent
                  };
                  return newMessages;
                });

                // Call the onChunk callback if provided
                if (onChunk) {
                  onChunk(parsed.content);
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      return assistantMessage;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send message';
      setError(errorMessage);
      
      // Remove the empty assistant message on error
      setMessages(prev => prev.slice(0, -1));
      
      toast({
        title: 'Chat Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const removeMessage = useCallback((index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    sendStreamingMessage,
    clearMessages,
    removeMessage
  };
}