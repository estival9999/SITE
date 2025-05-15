import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Announcement, Category, Department } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Loader2, Info, RefreshCw, AlertTriangle, X, Check, FileText, Trash2 } from "lucide-react";

interface AnnouncementCardProps {
  announcement: Announcement;
  isAdmin: boolean;
  isCreator: boolean;
}

export default function AnnouncementCard({ announcement, isAdmin, isCreator }: AnnouncementCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [readStatus, setReadStatus] = useState<boolean>(false); // This would come from API in a real implementation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get department and category specific styling
  const getDepartmentClass = () => {
    switch (announcement.department) {
      case Department.CONTROLES_INTERNOS:
        return "department-controles";
      case Department.ADMINISTRATIVO:
        return "department-administrativo";
      case Department.CICLO_DE_CREDITO:
        return "department-credito";
      default:
        return "";
    }
  };

  const getDepartmentBadgeClass = () => {
    switch (announcement.department) {
      case Department.CONTROLES_INTERNOS:
        return "badge-controles";
      case Department.ADMINISTRATIVO:
        return "badge-administrativo";
      case Department.CICLO_DE_CREDITO:
        return "badge-credito";
      default:
        return "";
    }
  };

  const getDepartmentLabel = () => {
    switch (announcement.department) {
      case Department.CONTROLES_INTERNOS:
        return "Controles Internos";
      case Department.ADMINISTRATIVO:
        return "Administrativo";
      case Department.CICLO_DE_CREDITO:
        return "Ciclo de Crédito";
      default:
        return "";
    }
  };

  const getCategoryIcon = () => {
    switch (announcement.category) {
      case Category.INFORMATIVO:
        return <Info className="h-3 w-3 text-gray-600" />;
      case Category.ATUALIZACAO:
        return <RefreshCw className="h-3 w-3 text-gray-600" />;
      case Category.DETERMINACAO:
        return <AlertTriangle className="h-3 w-3 text-gray-600" />;
      default:
        return <Info className="h-3 w-3 text-gray-600" />;
    }
  };

  const getCategoryTitle = () => {
    switch (announcement.category) {
      case Category.INFORMATIVO:
        return "Informativo";
      case Category.ATUALIZACAO:
        return "Atualização";
      case Category.DETERMINACAO:
        return "Determinação";
      default:
        return "";
    }
  };

  // Toggle read status mutation
  const toggleReadStatusMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/announcements/${announcement.id}/read-status`, {
        isRead: !readStatus,
      });
      return await res.json();
    },
    onSuccess: () => {
      setReadStatus(!readStatus);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/announcements/${announcement.id}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Comunicado Excluído",
        description: "O comunicado foi excluído com sucesso!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Ask question mutation
  const askQuestionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/announcements/${announcement.id}/questions`, {
        text: question,
        askerId: user?.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pergunta Enviada",
        description: "Sua pergunta foi enviada com sucesso!",
        variant: "default",
      });
      setQuestion("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar pergunta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on read flag or delete button
    if (
      e.target instanceof Element &&
      (e.target.closest(".read-flag") || e.target.closest(".delete-announcement"))
    ) {
      return;
    }

    setIsExpanded(!isExpanded);
    
    // Mark as read if expanding and not already read
    if (!isExpanded && !readStatus) {
      toggleReadStatusMutation.mutate();
    }
  };

  const handleReadFlagClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card expansion
    toggleReadStatusMutation.mutate();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card expansion
    setShowDeleteConfirm(true);
  };

  const handleAskQuestion = () => {
    if (!question.trim()) {
      toast({
        title: "Erro ao enviar pergunta",
        description: "O texto da pergunta não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }
    askQuestionMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div 
      className={cn(
        "announcement-card bg-white rounded-lg shadow overflow-hidden", 
        getDepartmentClass(),
        "cursor-pointer hover:shadow-md relative"
      )}
      onClick={handleCardClick}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <Badge className={cn("text-xs", getDepartmentBadgeClass())}>
            {getDepartmentLabel()}
          </Badge>
          <div className="flex items-center">
            <span 
              className="category-icon bg-gray-200 h-6 w-6 rounded-full flex items-center justify-center mr-2" 
              title={getCategoryTitle()}
            >
              {getCategoryIcon()}
            </span>
            <button 
              className={cn(
                "read-flag h-6 w-6 rounded-full flex items-center justify-center",
                readStatus ? "bg-green-100" : "bg-gray-200"
              )} 
              title={readStatus ? "Marcado como lido" : "Marcar como lido"}
              onClick={handleReadFlagClick}
              aria-label={readStatus ? "Marcado como lido" : "Marcar como lido"}
            >
              {readStatus ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Check className="h-3 w-3 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        
        <h3 className="font-semibold text-lg mt-2 text-gray-800">{announcement.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{formatDate(announcement.createdAt)}</p>
        <p className="text-sm text-gray-700 mt-2 line-clamp-2">{announcement.message}</p>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200">
          <Tabs defaultValue="content">
            <div className="bg-gray-50 px-4 py-3">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="content" className="tab-active">Conteúdo</TabsTrigger>
                <TabsTrigger value="question">Enviar Dúvida/Comentário</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-4">
              <TabsContent value="content">
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {announcement.message}
                </div>
                
                {announcement.attachment && (
                  <div className="mt-4 flex items-center text-sm text-[#5e8c6a] hover:text-[#88a65e]">
                    <FileText className="h-5 w-5 mr-1" />
                    <a href={announcement.attachment} target="_blank" rel="noopener noreferrer" className="font-medium">
                      {announcement.attachment.split('/').pop()}
                    </a>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="question">
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="mt-1 w-full"
                  rows={4}
                  placeholder="Digite sua dúvida ou comentário..."
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    className="bg-[#5e8c6a] hover:bg-[#88a65e]"
                    onClick={handleAskQuestion}
                    disabled={askQuestionMutation.isPending}
                  >
                    {askQuestionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar"
                    )}
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
      
      {/* Delete button - only visible for admin creator */}
      {isCreator && (
        <button
          className="delete-announcement absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm text-gray-400 hover:text-[#8c2318] focus:outline-none z-10"
          title="Excluir comunicado"
          onClick={handleDeleteClick}
          aria-label="Excluir comunicado"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir Comunicado"
        description="Tem certeza que deseja excluir este comunicado? Esta ação não pode ser desfeita."
        onConfirm={() => deleteAnnouncementMutation.mutate()}
        isLoading={deleteAnnouncementMutation.isPending}
      />
    </div>
  );
}
