import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Announcement } from "@shared/schema";
import { Search, Lightbulb, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function KnowledgeSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const { toast } = useToast();

  // Fetch announcements for search results
  const { data: searchResults, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/search", searchQuery],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: hasSearched && searchQuery.length >= 3,
  });

  // Send query to webhook for AI response via our backend
  const sendToAiMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/ask-ai", { query });
      
      if (!response.ok) {
        throw new Error("Falha ao obter resposta da IA");
      }
      
      return await response.json();
    },
    onMutate: () => {
      setIsAiResponding(true);
      setAiResponse(null);
    },
    onSuccess: (data) => {
      setAiResponse(data.response || "Não foi possível processar sua consulta.");
      setIsAiResponding(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao consultar IA",
        description: error.message,
        variant: "destructive"
      });
      setIsAiResponding(false);
    },
  });

  const handleSearch = () => {
    if (searchQuery.length >= 3) {
      setHasSearched(true);
    }
  };

  const handleAskAi = () => {
    if (searchQuery.length >= 3) {
      sendToAiMutation.mutate(searchQuery);
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
          <div className="space-y-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex space-x-2 mb-4">
                  <Button 
                    onClick={handleAskAi} 
                    className="flex items-center space-x-2 bg-[#5e8c6a] hover:bg-[#4a7056]"
                    disabled={searchQuery.length < 3 || isAiResponding}
                  >
                    {isAiResponding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Consultando IA...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        <span>Perguntar à IA</span>
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleSearch}
                    variant="outline"
                    className="flex items-center space-x-2"
                    disabled={searchQuery.length < 3}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    <span>Buscar Comunicados</span>
                  </Button>
                </div>
                
                {aiResponse ? (
                  <div className="w-full mt-4 text-left">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Resposta da IA:</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm whitespace-pre-line">{aiResponse}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <Lightbulb className="h-12 w-12 text-[#88a65e] mb-4 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">IA Corporativa Auralis</h3>
                    <p className="text-sm text-gray-500 max-w-md">
                      Digite sua pergunta na caixa de pesquisa acima e clique em "Perguntar à IA" para obter respostas instantâneas baseadas nos comunicados e documentos da empresa.
                    </p>
                    <p className="mt-3 text-sm text-gray-500">
                      Você também pode usar a busca para encontrar comunicados específicos.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : isLoading ? (
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
                        {result.createdAt && typeof result.createdAt === 'string' 
                          ? new Date(result.createdAt).toLocaleDateString('pt-BR') 
                          : result.createdAt instanceof Date 
                            ? result.createdAt.toLocaleDateString('pt-BR')
                            : ''}
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
