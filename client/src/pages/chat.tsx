import { useState, useEffect, useRef } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// URL do webhook do N8N Chat
const CHAT_WEBHOOK_URL = "https://mateusestival.app.n8n.cloud/webhook/662240cb-762b-4046-9cb1-ab3c386bf8a7/chat";

// Tipo para mensagens do chat
interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Inicializa o chat com uma mensagem de boas-vindas quando a página carrega
  useEffect(() => {
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      text: "Olá! Sou o assistente virtual da Auralis. Como posso ajudar você hoje?",
      sender: "bot",
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
    
    // Gera um ID único para a sessão do chat
    setChatId(generateChatId());
  }, []);

  // Scroll automático para a última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const generateChatId = () => {
    return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Adiciona a mensagem do usuário ao chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Prepara os dados para enviar ao webhook
      const requestData = {
        message: inputText,
        chatId: chatId,
        userId: "user123", // Poderia ser o ID real do usuário
        timestamp: new Date().toISOString(),
      };

      console.log("Enviando mensagem para webhook:", requestData);
      
      // Envia a mensagem para o webhook
      const response = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Erro na resposta do webhook: ${response.status}`);
      }

      // Lê a resposta como texto primeiro para debug
      const responseText = await response.text();
      console.log("Resposta do webhook (texto):", responseText);
      
      // Tenta fazer o parsing do JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error("Erro ao fazer parse da resposta:", error);
        // Se não conseguir fazer o parse, usa o texto como resposta
        const botMessage: ChatMessage = {
          id: Date.now().toString(),
          text: responseText || "Desculpe, não consegui processar sua pergunta.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
        return;
      }
      
      // Adiciona a resposta do bot ao chat
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        text: data.response || data.message || data.reply || "Não entendi completamente sua pergunta.",
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro na comunicação",
        description: "Não foi possível enviar sua mensagem. Tente novamente mais tarde.",
        variant: "destructive",
      });
      
      // Adiciona uma mensagem de erro ao chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        text: "Desculpe, tive um problema para processar sua mensagem. Poderia tentar novamente?",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AppLayout title="Chat com Assistente">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Assistente Virtual Auralis</h2>
        
        <Card className="h-[600px] flex flex-col">
          <CardContent className="flex-1 p-0 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`flex max-w-[80%] ${
                        message.sender === "user" 
                          ? "bg-[#5e8c6a] text-white" 
                          : "bg-gray-100 text-gray-800"
                      } rounded-lg p-3 shadow-sm`}
                    >
                      <div className="mr-2 mt-1">
                        {message.sender === "user" 
                          ? <User className="h-5 w-5" /> 
                          : <Bot className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="whitespace-pre-line">{message.text}</div>
                        <div className={`text-xs mt-1 ${message.sender === "user" ? "text-gray-200" : "text-gray-500"}`}>
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex bg-gray-100 text-gray-800 rounded-lg p-3 shadow-sm">
                      <Bot className="h-5 w-5 mr-2" />
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Digitando...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-[#5e8c6a] hover:bg-[#4d7257]"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Pressione Enter para enviar ou use o botão
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}