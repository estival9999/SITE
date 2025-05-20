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
        <Badge className="bg-emerald-500/10 text-emerald-400 border-0">
          Respondida
        </Badge>
      );
    } else if (question.isResolved) {
      return (
        <Badge className="bg-purple-500/10 text-purple-400 border-0">
          Resolvida
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-amber-500/10 text-amber-400 border-0">
          Aguardando resposta
        </Badge>
      );
    }
  };

  return (
    <li className="bg-[#2d2d38] border-b border-gray-700/30 last:border-b-0">
      <div className="px-5 py-4">
        <div className="flex flex-wrap justify-between gap-2">
          <div className="mb-1">
            <h3 className="text-sm leading-5 font-medium">
              {userView ? (
                <>
                  <span className="text-blue-300">Você perguntou sobre:</span>{" "}
                  <span className="text-white">{announcementTitle}</span>
                </>
              ) : (
                <>
                  <span className="text-blue-300">Referente a:</span>{" "}
                  <span className="text-white">{announcementTitle}</span>
                </>
              )}
            </h3>
            <p className="mt-1 max-w-2xl text-xs text-gray-400">
              {userView ? (
                <>{formatDate(question.createdAt)}</>
              ) : (
                <>De: {question.asker?.name} - {formatDate(question.createdAt)}</>
              )}
            </p>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="mt-3 bg-[#353542] p-3 rounded-lg">
          <p className="text-sm text-gray-200">{question.text}</p>
        </div>
        
        {question.answerText && (
          <div className="mt-4 border-l-2 border-blue-500/50 pl-3">
            <p className="text-xs font-medium text-blue-400">
              {userView ? (
                <>Resposta de {question.answeredBy?.name} ({question.answeredBy?.actingDepartment}):</>
              ) : (
                <>Sua resposta:</>
              )}
            </p>
            <p className="mt-1 text-sm text-gray-300">{question.answerText}</p>
            <p className="mt-1 text-xs text-gray-500">Respondido em: {question.answeredAt ? formatDate(question.answeredAt) : ''}</p>
          </div>
        )}
        
        {responseForm}
      </div>
    </li>
  );
}
