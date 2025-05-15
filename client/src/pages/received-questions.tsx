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
        <h2 className="text-xl font-bold text-gray-800 mb-6">Perguntas Recebidas</h2>
        
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#5e8c6a]" />
              </div>
            ) : !sortedQuestions || sortedQuestions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Não há perguntas para responder no momento.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {sortedQuestions.map((question) => (
                  <QuestionItem 
                    key={question.id} 
                    question={question} 
                    userView={false}
                    responseForm={
                      !question.answerText && (
                        <div className="mt-4">
                          <label htmlFor={`answer-${question.id}`} className="block text-sm font-medium text-gray-700">
                            Sua resposta:
                          </label>
                          <Textarea
                            id={`answer-${question.id}`}
                            rows={4}
                            className="mt-1 w-full"
                            placeholder="Digite sua resposta..."
                            value={answers[question.id] || ""}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          />
                          <div className="mt-3 flex justify-end space-x-3">
                            <Button
                              variant="outline"
                              onClick={() => handleMarkResolved(question.id)}
                              disabled={resolveQuestionMutation.isPending}
                            >
                              Marcar como Resolvida
                            </Button>
                            <Button
                              className="bg-[#5e8c6a] hover:bg-[#88a65e]"
                              onClick={() => handleSendAnswer(question.id)}
                              disabled={answerQuestionMutation.isPending}
                            >
                              {answerQuestionMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
