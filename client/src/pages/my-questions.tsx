import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Question } from "@shared/schema";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import QuestionItem from "@/components/questions/QuestionItem";
import { Loader2 } from "lucide-react";

export default function MyQuestions() {
  // Fetch the user's questions
  const { data: questions, isLoading, error } = useQuery<Question[]>({
    queryKey: ["/api/questions/mine"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  return (
    <AppLayout title="Minhas Perguntas">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-5 bg-[#353542] rounded-lg overflow-hidden shadow">
          <div className="px-4 py-3 flex items-center border-b border-gray-700/30">
            <h3 className="text-sm font-medium text-blue-300">Histórico de perguntas</h3>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-2" />
                <span className="text-sm text-gray-400">Carregando perguntas...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 bg-[#331a1e] text-red-300 rounded-none border-y border-red-900/30">
              <p className="text-sm flex items-center">
                <span className="text-red-400 mr-2">⚠</span>
                Erro ao carregar suas perguntas. Tente novamente mais tarde.
              </p>
            </div>
          ) : questions && questions.length > 0 ? (
            <ul className="divide-y divide-gray-700/30">
              {questions.map((question) => (
                <QuestionItem key={question.id} question={question} userView={true} />
              ))}
            </ul>
          ) : (
            <div className="p-6 bg-[#2d2d38] text-center">
              <p className="text-gray-300">Você ainda não fez nenhuma pergunta.</p>
              <p className="mt-2 text-sm text-gray-400">
                Para fazer uma pergunta, acesse um comunicado na "Caixa de Comunicados" e use a aba "Perguntas".
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
