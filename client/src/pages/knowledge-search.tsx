import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Announcement } from "@shared/schema";
import { Search, Lightbulb, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Webhook URL fornecido
const WEBHOOK_URL = "https://mateusestival.app.n8n.cloud/webhook-test/18b90e2d-e422-40d6-a880-225b8337f016";

export default function KnowledgeSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { toast } = useToast();

  // Fetch announcements for search results
  const { data: searchResults, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/search", searchQuery],
    queryFn: () => fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Erro na busca: ${res.status}`);
        }
        return res.json();
      }),
    enabled: hasSearched && searchQuery.length >= 3,
  });

  // Função para fazer a requisição ao webhook
  const fetchAiResponse = async (query: string) => {
    setIsAiLoading(true);
    setAiResponse(null);
    
    try {
      console.log("Enviando consulta para a IA:", query);
      
      // Dados para enviar ao webhook
      const requestData = {
        query: query,
        userId: "user123",  // Poderia ser o ID real do usuário
        timestamp: new Date().toISOString(),
        source: "corporate-communications"
      };
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
      });
      
      console.log("Status da resposta:", response.status);
      
      if (!response.ok) {
        throw new Error(`Erro na resposta do webhook: ${response.status}`);
      }
      
      // Lendo a resposta como texto primeiro para debug
      const responseText = await response.text();
      console.log("Resposta do webhook (texto):", responseText);
      
      // Tentando fazer o parsing do JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Erro ao fazer parse da resposta:", parseError);
        // Se não conseguir fazer o parse, usa o texto como resposta
        setAiResponse(responseText || "Resposta recebida, mas em formato não processável.");
        return;
      }
      
      // Se conseguiu fazer o parse, procura pelo campo de resposta
      if (data && (data.response || data.answer || data.result)) {
        const aiAnswer = data.response || data.answer || data.result;
        console.log("Resposta processada:", aiAnswer);
        setAiResponse(aiAnswer);
      } else {
        // Se não encontrar nenhum dos campos esperados, exibe o objeto completo
        setAiResponse(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error("Erro ao consultar IA:", error);
      toast({
        title: "Erro ao consultar IA",
        description: "Não foi possível obter uma resposta neste momento. Tente novamente mais tarde.",
        variant: "destructive",
      });
      // Define uma resposta de fallback para erros
      setAiResponse("Não foi possível obter uma resposta do assistente neste momento. " +
                   "Nossos sistemas estão com alta demanda. Por favor, tente novamente em alguns minutos.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.length >= 3) {
      setHasSearched(true);
      fetchAiResponse(searchQuery);
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Assistente de IA Integrado</h3>
              <p className="text-sm text-gray-500 max-w-md">
                Faça perguntas diretamente e nosso assistente de IA fornecerá respostas baseadas nos comunicados e documentos da empresa.
              </p>
              <p className="mt-3 text-sm text-gray-500">
                Digite sua pergunta na caixa de busca acima e receba uma resposta instantânea.
              </p>
            </CardContent>
          </Card>
        ) : (isLoading || isAiLoading) ? (
          <Card>
            <CardContent className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center">
                <div className="animate-pulse mb-2">Consultando IA e buscando comunicados...</div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Resposta da IA */}
            {aiResponse && (
              <Card className="border-[#5e8c6a] border-l-4">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Bot className="h-6 w-6 text-[#5e8c6a] mr-2" />
                    <h3 className="text-lg font-medium text-gray-800">Resposta do Assistente AI</h3>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-gray-700 whitespace-pre-line">{aiResponse}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Esta resposta foi gerada automaticamente com base na sua pergunta. 
                    Se precisar de mais detalhes, consulte os documentos relacionados abaixo.
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Resultados da busca em documentos */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Comunicados relacionados:</h3>
              
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
                    <p className="text-gray-500">Nenhum comunicado encontrado para "{searchQuery}".</p>
                    <p className="mt-2 text-sm text-gray-400">Consulte a resposta da IA acima ou tente termos diferentes.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
