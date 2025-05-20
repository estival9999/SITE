import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { UserRole, Question } from "@shared/schema";
import AppLayout from "@/layouts/AppLayout";
import QuestionItem from "@/components/questions/QuestionItem";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function ReceivedQuestions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Check if user is admin
  if (user?.role !== UserRole.ADMIN) {
    navigate("/announcements");
    toast({
      title: "Acesso Negado",
      description: "Você não tem permissão para acessar esta página.",
      variant: "destructive",
    });
    return null;
  }

  // Fetch received questions
  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions/received"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Answer question mutation
  const answerQuestionMutation = useMutation({
    mutationFn: async ({ questionId, answerText }: { questionId: number; answerText: string }) => {
      const res = await apiRequest("POST", `/api/questions/${questionId}/answer`, { answerText });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Resposta Enviada",
        description: "Sua resposta foi enviada com sucesso!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions/received"] });
      setAnswers({});
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Responder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark question as resolved mutation
  const resolveQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const res = await apiRequest("POST", `/api/questions/${questionId}/resolve`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pergunta Resolvida",
        description: "A pergunta foi marcada como resolvida.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions/received"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Resolver",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnswerChange = (questionId: number, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleSendAnswer = (questionId: number) => {
    const answerText = answers[questionId];
    if (!answerText || answerText.trim() === "") {
      toast({
        title: "Erro ao Responder",
        description: "A resposta não pode estar vazia.",
        variant: "destructive",
      });
      return;
    }

    answerQuestionMutation.mutate({ questionId, answerText });
  };

  const handleMarkResolved = (questionId: number) => {
    resolveQuestionMutation.mutate(questionId);
  };

  // Filter and sort questions
  const sortedQuestions = questions?.sort((a, b) => {
    // First, sort by status (unanswered first)
    if (!a.answerText && b.answerText) return -1;
    if (a.answerText && !b.answerText) return 1;
    
    // Then by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <AppLayout title="Perguntas Recebidas">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-5 bg-[#353542] rounded-lg overflow-hidden shadow">
          <div className="px-4 py-3 flex items-center border-b border-gray-700/30">
            <h3 className="text-sm font-medium text-blue-300">Suas perguntas para responder</h3>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-2" />
                <span className="text-sm text-gray-400">Carregando perguntas...</span>
              </div>
            </div>
          ) : !sortedQuestions || sortedQuestions.length === 0 ? (
            <div className="p-6 bg-[#2d2d38] text-center">
              <p className="text-gray-400 text-sm">Não há perguntas para responder no momento.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-700/30">
              {sortedQuestions.map((question) => (
                <QuestionItem 
                  key={question.id} 
                  question={question} 
                  userView={false}
                  responseForm={
                    !question.answerText && (
                      <div className="mt-4">
                        <label htmlFor={`answer-${question.id}`} className="block text-sm font-medium text-gray-200 mb-2">
                          Sua resposta:
                        </label>
                        <Textarea
                          id={`answer-${question.id}`}
                          rows={3}
                          className="w-full bg-[#353542] border-0 focus:ring-1 focus:ring-blue-500 rounded text-white placeholder:text-gray-500 resize-none"
                          placeholder="Digite sua resposta..."
                          value={answers[question.id] || ""}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        />
                        <div className="mt-3 flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            className="h-9 text-sm text-gray-300 hover:text-gray-100 hover:bg-[#2d2d38]"
                            onClick={() => handleMarkResolved(question.id)}
                            disabled={resolveQuestionMutation.isPending}
                          >
                            Marcar como Resolvida
                          </Button>
                          <Button
                            className="h-9 text-sm px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={() => handleSendAnswer(question.id)}
                            disabled={answerQuestionMutation.isPending}
                          >
                            {answerQuestionMutation.isPending ? (
                              <>
                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              "Enviar Resposta"
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
