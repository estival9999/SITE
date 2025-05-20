import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { UserRole, User, Department, Location } from "@shared/schema";
import AppLayout from "@/layouts/AppLayout";
import UserModal from "@/components/users/UserModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit } from "lucide-react";
import { useLocation } from "wouter";

export default function ManageUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      navigate("/announcements");
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);

  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Create/update user mutation
  const userMutation = useMutation({
    mutationFn: async (userData: Partial<User> & { id?: number }) => {
      if (userData.id) {
        // Update existing user
        const res = await apiRequest("PATCH", `/api/users/${userData.id}`, userData);
        return await res.json();
      } else {
        // Create new user
        const res = await apiRequest("POST", "/api/users", userData);
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: currentUser ? "Usuário Atualizado" : "Usuário Criado",
        description: currentUser 
          ? "As informações do usuário foram atualizadas com sucesso!" 
          : "O novo usuário foi criado com sucesso!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsModalOpen(false);
      setCurrentUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openAddUserModal = () => {
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = (userData: Partial<User>) => {
    userMutation.mutate(currentUser ? { ...userData, id: currentUser.id } : userData);
  };

  // Function to get department badge class
  const getDepartmentBadgeClass = (department?: Department) => {
    switch (department) {
      case Department.CONTROLES_INTERNOS:
        return "badge-controles";
      case Department.ADMINISTRATIVO:
        return "badge-administrativo";
      case Department.CICLO_DE_CREDITO:
        return "badge-credito";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  return (
    <AppLayout title="Gerenciar Usuários">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          
          <Button
            onClick={openAddUserModal}
            className="bg-[#5e8c6a] hover:bg-[#88a65e]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Usuário
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#5e8c6a]" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Papel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Área / Locais
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users?.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="" alt={user.name} />
                              <AvatarFallback className="bg-[#88a65e] text-white">
                                {user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={user.role === UserRole.ADMIN ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                            {user.role === UserRole.ADMIN ? "Admin" : "Leitor"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.role === UserRole.ADMIN && user.actingDepartment ? (
                            <Badge className={getDepartmentBadgeClass(user.actingDepartment)}>
                              {user.actingDepartment === Department.CONTROLES_INTERNOS 
                                ? "Controles Internos" 
                                : user.actingDepartment === Department.ADMINISTRATIVO 
                                  ? "Administrativo" 
                                  : "Ciclo de Crédito"}
                            </Badge>
                          ) : user.role === UserRole.READER && user.assignedLocations?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {(user.assignedLocations as Location[]).map((location, index) => (
                                <Badge key={index} variant="outline" className="bg-gray-100 text-gray-800">
                                  {location === Location.MARACAJU 
                                    ? "Maracaju" 
                                    : location === Location.SIDROLANDIA 
                                      ? "Sidrolândia" 
                                      : location === Location.AQUIDAUANA 
                                        ? "Aquidauana" 
                                        : "Nioaque"}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-[#5e8c6a] hover:text-[#88a65e]"
                            onClick={() => openEditUserModal(user)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <UserModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        user={currentUser}
        onSave={handleSaveUser}
        isPending={userMutation.isPending}
      />
    </AppLayout>
  );
}
