import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Announcement } from "@shared/schema";
import { Search, Lightbulb } from "lucide-react";

export default function KnowledgeSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch announcements for search results
  const { data: searchResults, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/search", searchQuery],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: hasSearched && searchQuery.length >= 3,
  });

  const handleSearch = () => {
    if (searchQuery.length >= 3) {
      setHasSearched(true);
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
              <Lightbulb className="h-12 w-12 text-[#88a65e] mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Integração com IA em breve</h3>
              <p className="text-sm text-gray-500 max-w-md">
                Em breve, você poderá fazer perguntas diretamente à nossa IA para obter respostas instantâneas baseadas nos comunicados e documentos da empresa.
              </p>
              <p className="mt-3 text-sm text-gray-500">
                Por enquanto, utilize a busca para encontrar comunicados específicos.
              </p>
            </CardContent>
          </Card>
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
                        {new Date(result.createdAt).toLocaleDateString('pt-BR')}
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
