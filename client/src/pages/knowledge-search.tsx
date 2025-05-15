import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Announcement } from "@shared/schema";
import { Search, Lightbulb, Bot, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Interface para a resposta da API do webhook
interface AIResponse {
  answer: string;
  sources?: {
    title: string;
    content: string;
    metadata?: any;
  }[];
}

export default function KnowledgeSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const { toast } = useToast();

  // Webhook para consulta de conhecimento
  const webhookUrl = "https://mateusestival.app.n8n.cloud/webhook/784c321e-9442-4ebc-9572-f53a31e14000/chat";

  // ID de sessão para o agente do n8n
  const sessionId = "auralis-corporate-comms-session-001";

  // Mutation para chamar o webhook
  const aiQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query, 
          sessionId 
        }),
      });
      
      if (!response.ok) {
        throw new Error("Falha ao obter resposta da IA");
      }
      
      return await response.json() as AIResponse;
    },
    onSuccess: (data) => {
      setAiResponse(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na consulta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch announcements for search results (mantido para compatibilidade)
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery<Announcement[]>({
    queryKey: ["/api/search", searchQuery],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: hasSearched && searchQuery.length >= 3 && !aiQueryMutation.isPending && !aiResponse,
  });

  const handleSearch = () => {
    if (searchQuery.length >= 3) {
      setHasSearched(true);
      setAiResponse(null);
      aiQueryMutation.mutate(searchQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <AppLayout title="Busca de Conhecimento">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Busca de Conhecimento</h2>
        
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Input
                  id="knowledgeSearch"
                  className="pl-4 pr-10 py-6 text-base"
                  placeholder="Digite sua pergunta ou termos de busca..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0"
                    onClick={handleSearch}
                    disabled={searchQuery.length < 3}
                  >
                    <Search className="h-5 w-5 text-gray-400" />
                  </Button>
                </div>
              </div>
              
              {hasSearched && searchQuery.length < 3 && (
                <p className="mt-2 text-sm text-red-500">
                  A busca deve conter pelo menos 3 caracteres.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {!hasSearched || searchQuery.length < 3 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-12 w-12 text-[#88a65e] mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Consulta de Conhecimento</h3>
              <p className="text-sm text-gray-500 max-w-md">
                Faça perguntas diretamente à nossa IA para obter respostas instantâneas baseadas nos comunicados e documentos da empresa.
              </p>
              <p className="mt-3 text-sm text-gray-500">
                Digite sua pergunta no campo acima e obtenha respostas detalhadas.
              </p>
            </CardContent>
          </Card>
        ) : aiQueryMutation.isPending ? (
          <Card>
            <CardContent className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#5e8c6a] mb-4" />
                <div className="text-gray-600">Consultando IA...</div>
              </div>
            </CardContent>
          </Card>
        ) : aiResponse ? (
          <div className="space-y-6">
            <Card className="border-l-4 border-[#5e8c6a]">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Bot className="h-6 w-6 text-[#5e8c6a] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Resposta</h3>
                    <div className="text-gray-700 whitespace-pre-line">
                      {aiResponse.answer}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {aiResponse.sources && aiResponse.sources.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
                  Fontes de informação
                </h3>
                <div className="space-y-3">
                  {aiResponse.sources.map((source, idx) => (
                    <Card key={idx} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <h4 className="text-[#5e8c6a] font-medium">{source.title || "Fonte " + (idx + 1)}</h4>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-3">{source.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : isLoadingSearch ? (
          <Card>
            <CardContent className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center">
                <div className="animate-pulse mb-2">Buscando...</div>
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
                        {typeof result.createdAt === 'string' ? new Date(result.createdAt).toLocaleDateString('pt-BR') : ''}
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
                  <p className="mt-2 text-sm text-gray-400">Tente usar termos diferentes ou mais específicos.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
