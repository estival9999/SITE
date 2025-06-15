import { useState, useRef, useEffect, useCallback } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, SendHorizontal, Loader2, User, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  error?: boolean;
}

// Função para gerar IDs únicos
const generateId = () => {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export default function KnowledgeSearch() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on mount and after actions
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const sendMessage = async (messageToSend?: string) => {
    const content = messageToSend || inputMessage;
    if (!content.trim() || isLoading) return;

    const messageContent = content.trim();
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageToSend) {
      setInputMessage("");
    }
    setIsLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          context: messages.length > 0 ? `Previous conversation: ${messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}` : undefined
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro na requisição: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.message?.content || data.response || "Desculpe, não consegui processar sua mensagem.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      const isTimeout = errorMessage.includes('abort');
      
      // Add error message to chat
      const errorMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: isTimeout 
          ? "A requisição demorou muito para responder. Por favor, tente novamente."
          : `Erro: ${errorMessage}. Por favor, tente novamente.`,
        timestamp: new Date(),
        error: true
      };
      
      setMessages(prev => [...prev, errorMsg]);
      setError(errorMessage);
      
      toast({
        title: "Erro ao enviar mensagem",
        description: isTimeout ? "Tempo limite excedido" : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Ensure input gets focus after a small delay
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      setInputMessage(lastUserMessage.content);
      // Remove error message if exists
      setMessages(prev => prev.filter(m => !m.error));
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    setInputMessage("");
    inputRef.current?.focus();
  };

  return (
    <AppLayout title="Assistente IA">
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col p-4">
        <Card className="flex-1 flex flex-col shadow-lg border-[#2a2a3a] bg-[#1a1a26] h-full">
          <CardHeader className="border-b border-[#2a2a3a] bg-[#161622] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-lg shadow-md">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Assistente IA</h2>
                  <p className="text-sm text-gray-400">Pergunte qualquer coisa sobre a empresa</p>
                </div>
              </div>
              {messages.length > 0 && (
                <Button
                  onClick={clearChat}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-[#2a2a3a]"
                >
                  Limpar chat
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-6 min-h-0" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="bg-[#13131d] p-6 rounded-xl mb-5 border border-[#2a2a3a] shadow-lg">
                    <Bot className="h-16 w-16 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-medium text-blue-300 mb-3">Olá! Como posso ajudar?</h3>
                  <p className="text-gray-400 max-w-md mb-8">
                    Faça perguntas sobre políticas, comunicados, processos ou qualquer informação da empresa.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {[
                      "Quais são os comunicados mais recentes?",
                      "Qual é a política de férias da empresa?",
                      "Como funciona o processo de aprovação de despesas?",
                      "Quais são as metas da empresa para este ano?"
                    ].map((suggestion, index) => (
                      <button
                        key={`suggestion-${index}`}
                        onClick={() => {
                          sendMessage(suggestion);
                        }}
                        className="bg-[#1a1a26] p-4 rounded-lg border border-[#2a2a3a] hover:border-blue-700 text-left hover:shadow-md hover:bg-blue-900/10 transition-all duration-300"
                      >
                        <p className="text-sm text-blue-300">{suggestion}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-shrink-0 ${message.role === 'user' ? 'bg-blue-600' : message.error ? 'bg-red-600' : 'bg-[#2a2a3a]'} w-8 h-8 rounded-lg flex items-center justify-center`}>
                          {message.role === 'user' ? (
                            <User className="h-4 w-4 text-white" />
                          ) : message.error ? (
                            <AlertCircle className="h-4 w-4 text-white" />
                          ) : (
                            <Bot className="h-4 w-4 text-blue-400" />
                          )}
                        </div>
                        <div
                          className={`px-4 py-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : message.error
                              ? 'bg-red-900/20 text-red-200 border border-red-800'
                              : 'bg-[#13131d] text-gray-200 border border-[#2a2a3a]'
                          }`}
                        >
                          {message.role === 'assistant' ? (
                            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-blue-300 prose-a:text-blue-400 prose-a:hover:text-blue-300 prose-strong:text-white prose-code:bg-[#1a1a26] prose-code:text-blue-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-[#2a2a3a]">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <p className={`text-xs ${message.role === 'user' ? 'text-blue-200' : message.error ? 'text-red-400' : 'text-gray-500'}`}>
                              {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {message.error && (
                              <Button
                                onClick={retryLastMessage}
                                variant="ghost"
                                size="sm"
                                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 h-6 px-2"
                              >
                                Tentar novamente
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex gap-3 max-w-[80%]">
                        <div className="flex-shrink-0 bg-[#2a2a3a] w-8 h-8 rounded-lg flex items-center justify-center">
                          <Bot className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="bg-[#13131d] px-4 py-3 rounded-lg border border-[#2a2a3a]">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                            <span className="text-sm text-gray-400">Pensando...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </ScrollArea>

            <div className="border-t border-[#2a2a3a] bg-[#161622] p-4 flex-shrink-0 relative z-10">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    disabled={isLoading}
                    className="w-full bg-[#13131d] border-[#2a2a3a] text-white placeholder:text-gray-500 focus:border-blue-600 pr-12"
                    autoComplete="off"
                    autoFocus
                  />
                  {inputMessage.length > 0 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      {inputMessage.length}/500
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading || inputMessage.length > 500}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </form>
              {inputMessage.length > 500 && (
                <p className="text-xs text-red-400 mt-2">Mensagem muito longa. Máximo de 500 caracteres.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}