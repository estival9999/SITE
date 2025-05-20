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
        
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#5e8c6a]" />
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-600">
                <p>Erro ao carregar suas perguntas. Tente novamente mais tarde.</p>
              </div>
            ) : questions && questions.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {questions.map((question) => (
                  <QuestionItem key={question.id} question={question} userView={true} />
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>Você ainda não fez nenhuma pergunta.</p>
                <p className="mt-1 text-sm">
                  Para fazer uma pergunta, acesse um comunicado na "Caixa de Comunicados" e use a aba "Enviar Dúvida/Comentário".
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
