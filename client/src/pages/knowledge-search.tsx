import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Announcement } from "@shared/schema";
import { Search, Lightbulb, Bot, SendHorizontal, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// URL do webhook n8n para o chat
const CHAT_WEBHOOK_URL = "https://mateusestival.app.n8n.cloud/webhook/662240cb-762b-4046-9cb1-ab3c386bf8a7/chat";

export default function KnowledgeSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [chatActive, setChatActive] = useState(false);
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch announcements for search results
  const { data: searchResults, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/search", searchQuery],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: hasSearched && searchQuery.length >= 3 && !chatActive,
  });

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (searchQuery.length < 3) {
      setHasSearched(true);
      return;
    }

    // Se o chat estiver ativo, enviamos a pergunta para o webhook
    if (chatActive) {
      await sendChatMessage();
    } else {
      // Caso contrário, realizamos a busca padrão
      setHasSearched(true);
    }
  };

  const sendChatMessage = async () => {
    // Limpa respostas e erros anteriores
    setChatResponse(null);
    setError(null);
    setIsChatLoading(true);
    
    try {
      console.log("Enviando consulta para a IA:", searchQuery);
      
      const response = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: searchQuery
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Assumindo que a resposta vem no formato { reply: "..." }
      // Ajuste conforme a estrutura real da resposta do webhook
      if (data.reply) {
        setChatResponse(data.reply);
      } else if (data.response) {
        setChatResponse(data.response);
      } else {
        setChatResponse(JSON.stringify(data));
      }
    } catch (err) {
      console.error("Erro ao consultar IA:", err);
      setError("Desculpe, não foi possível obter uma resposta no momento. Tente novamente mais tarde.");
      toast({
        title: "Erro na consulta",
        description: "Não foi possível conectar ao serviço de IA.",
        variant: "destructive",
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  const toggleChatMode = () => {
    setChatActive(!chatActive);
    setChatResponse(null);
    setError(null);
  };

  return (
    <AppLayout title="Busca de Conhecimento">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Busca de Conhecimento</h2>
          <Button 
            variant={chatActive ? "default" : "outline"} 
            onClick={toggleChatMode}
            className={chatActive ? "bg-[#5e8c6a] hover:bg-[#4d7358]" : ""}
          >
            <Bot className="h-4 w-4 mr-2" />
            {chatActive ? "Modo IA Ativo" : "Ativar Modo IA"}
          </Button>
        </div>
        
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Input
                    id="knowledgeSearch"
                    className="pl-4 pr-10 py-6 text-base"
                    placeholder={chatActive 
                      ? "Faça uma pergunta para a IA..." 
                      : "Digite sua pergunta ou termos de busca..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Button 
                      type="submit"
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      disabled={searchQuery.length < 3 || isChatLoading}
                    >
                      {chatActive ? (
                        <SendHorizontal className="h-5 w-5 text-[#5e8c6a]" />
                      ) : (
                        <Search className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </form>
              
              {hasSearched && searchQuery.length < 3 && (
                <p className="mt-2 text-sm text-red-500">
                  A busca deve conter pelo menos 3 caracteres.
                </p>
              )}
              
              {chatActive && (
                <p className="mt-2 text-sm text-[#5e8c6a]">
                  Modo IA ativo: suas perguntas serão respondidas pela inteligência artificial.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Chat mode active */}
        {chatActive ? (
          <Card className="border border-[#e9f0eb]">
            <CardContent className="p-6">
              {error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-md">
                  <p>{error}</p>
                </div>
              ) : isChatLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-[#5e8c6a] animate-spin mb-4" />
                  <p className="text-gray-600">Processando sua pergunta...</p>
                </div>
              ) : chatResponse ? (
                <div>
                  <div className="flex items-start mb-4">
                    <div className="bg-[#e9f0eb] p-3 rounded-lg mr-2">
                      <p className="text-gray-700">{searchQuery}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start mt-6">
                    <div className="bg-[#5e8c6a] text-white p-4 rounded-lg">
                      <Bot className="h-5 w-5 mb-2" />
                      <div className="whitespace-pre-line">{chatResponse}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bot className="h-12 w-12 text-[#5e8c6a] mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Assistente de IA</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    Digite sua pergunta na caixa acima para obter respostas baseadas nos comunicados e documentos da empresa.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : !hasSearched || searchQuery.length < 3 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Lightbulb className="h-12 w-12 text-[#88a65e] mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Modo de Busca Ativo</h3>
              <p className="text-sm text-gray-500 max-w-md">
                Digite termos de busca para encontrar comunicados relevantes, ou ative o modo IA para fazer perguntas diretamente.
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 text-[#5e8c6a] animate-spin mb-4" />
                <div>Buscando resultados...</div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Resultados da busca:</h3>
            
            {searchResults && searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <Card key={result.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h4 className="text-[#5e8c6a] font-medium">{result.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {result.createdAt ? new Date(result.createdAt).toLocaleDateString('pt-BR') : ''}
                      </p>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{result.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">Nenhum resultado encontrado para "{searchQuery}".</p>
                  <p className="mt-2 text-sm text-gray-400">Tente usar termos diferentes ou mais específicos, ou ative o modo IA para obter respostas diretas.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
