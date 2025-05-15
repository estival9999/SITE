import { ReactNode } from "react";
import { Question } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuestionItemProps {
  question: Question;
  userView: boolean;
  responseForm?: ReactNode;
}

export default function QuestionItem({ question, userView, responseForm }: QuestionItemProps) {
  // Extract announcement details or add announcement query if needed
  const announcementTitle = question.announcement?.title || "Comunicado";
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = () => {
    if (question.answerText) {
      return (
        <Badge className="bg-green-100 text-green-800">
          Respondida
        </Badge>
      );
    } else if (question.isResolved) {
      return (
        <Badge className="bg-purple-100 text-purple-800">
          Resolvida
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          Aguardando resposta
        </Badge>
      );
    }
  };

  return (
    <li>
      <div className="px-4 py-5 sm:px-6">
        <div className="flex flex-wrap justify-between">
          <div className="mb-2 md:mb-0">
            <h3 className="text-sm leading-5 font-semibold">
              {userView ? (
                <>
                  <span className="text-[#5e8c6a]">Você perguntou sobre:</span> {announcementTitle}
                </>
              ) : (
                <>
                  <span className="text-[#5e8c6a]">Referente a:</span> {announcementTitle}
                </>
              )}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {userView ? (
                <>{formatDate(question.createdAt)}</>
              ) : (
                <>De: {question.asker?.name} - {formatDate(question.createdAt)}</>
              )}
            </p>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="mt-4 bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-700">{question.text}</p>
        </div>
        
        {question.answerText && (
          <div className="mt-4 border-l-4 border-[#5e8c6a] pl-4">
            <p className="text-sm font-medium text-gray-700">
              {userView ? (
                <>Resposta de {question.answeredBy?.name} ({question.answeredBy?.actingDepartment}):</>
              ) : (
                <>Sua resposta:</>
              )}
            </p>
            <p className="mt-1 text-sm text-gray-700">{question.answerText}</p>
            <p className="mt-1 text-xs text-gray-500">Respondido em: {question.answeredAt ? formatDate(question.answeredAt) : ''}</p>
          </div>
        )}
        
        {responseForm}
      </div>
    </li>
  );
}
