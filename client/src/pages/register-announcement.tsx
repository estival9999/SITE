import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Category, Department, Location, UserRole } from "@shared/schema";
import { Loader2, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Create a schema for announcement form
const announcementFormSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  message: z.string().min(1, "A mensagem é obrigatória"),
  department: z.nativeEnum(Department, {
    errorMap: () => ({ message: "Selecione uma área responsável" }),
  }),
  category: z.nativeEnum(Category, {
    errorMap: () => ({ message: "Selecione uma categoria" }),
  }),
  targetedLocations: z.array(z.nativeEnum(Location)).min(1, "Selecione pelo menos um local"),
  attachment: z.instanceof(File).optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

export default function RegisterAnnouncement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      navigate("/announcements");
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);

  // Set up form
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: "",
      message: "",
      department: user?.actingDepartment || undefined,
      category: undefined,
      targetedLocations: [],
      attachment: undefined,
    },
  });

  // Handle department field based on actingDepartment restriction
  useEffect(() => {
    if (user?.actingDepartment) {
      form.setValue("department", user.actingDepartment);
    }
  }, [user, form]);

  // Create mutation for registering announcement
  const registerAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementFormValues | FormData) => {
      // Se o anexo estiver presente, use FormData, caso contrário use JSON
      if (data instanceof FormData) {
        const res = await apiRequest("POST", "/api/announcements", data, "formdata");
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/announcements", data);
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Comunicado Registrado",
        description: "O comunicado foi registrado com sucesso!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      navigate("/announcements");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Registrar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: AnnouncementFormValues) => {
    // Validate required fields first
    if (!data.title || !data.message || !data.department || !data.category || !data.targetedLocations.length) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios antes de submeter o formulário.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Submitting data:", data);
    
    try {
      // Se tiver um anexo, use FormData, caso contrário, envie como JSON
      if (data.attachment) {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("message", data.message);
        formData.append("department", data.department);
        formData.append("category", data.category);
        
        // Handle targetedLocations array properly
        if (data.targetedLocations && data.targetedLocations.length > 0) {
          data.targetedLocations.forEach((location, index) => {
            formData.append(`targetedLocations[${index}]`, location);
          });
        }
        
        formData.append("attachment", data.attachment);
        
        // Log FormData contents for debugging
        console.log("Sending as FormData:");
        console.log("title:", formData.get("title"));
        console.log("message:", formData.get("message"));
        console.log("department:", formData.get("department"));
        console.log("category:", formData.get("category"));

        registerAnnouncementMutation.mutate(formData);
      } else {
        // Sem anexo, enviar como JSON
        console.log("Sending as JSON:", data);
        registerAnnouncementMutation.mutate({
          title: data.title,
          message: data.message,
          department: data.department,
          category: data.category,
          targetedLocations: data.targetedLocations
        });
      }
    } catch (error) {
      console.error("Error preparing form data:", error);
      toast({
        title: "Erro ao preparar formulário",
        description: "Ocorreu um erro ao preparar os dados para envio. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Options for departments, categories, and locations
  const departmentOptions = [
    { value: Department.CONTROLES_INTERNOS, label: "Controles Internos" },
    { value: Department.ADMINISTRATIVO, label: "Administrativo" },
    { value: Department.CICLO_DE_CREDITO, label: "Ciclo de Crédito" },
  ];

  const categoryOptions = [
    { value: Category.INFORMATIVO, label: "Informativo" },
    { value: Category.ATUALIZACAO, label: "Atualização" },
    { value: Category.DETERMINACAO, label: "Determinação" },
  ];

  const locationOptions = [
    { value: Location.MARACAJU, label: "Maracaju" },
    { value: Location.SIDROLANDIA, label: "Sidrolândia" },
    { value: Location.AQUIDAUANA, label: "Aquidauana" },
    { value: Location.NIOAQUE, label: "Nioaque" },
  ];

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("attachment", file);
    }
  };

  return (
    <AppLayout title="Registrar Comunicado">
      <div className="max-w-3xl mx-auto">
        <div className="mb-5 bg-[#353542] rounded-lg overflow-hidden shadow">
          <div className="px-4 py-3 border-b border-gray-700/30">
            <h3 className="text-sm font-medium text-blue-300">Novo comunicado</h3>
          </div>
          
          <div className="p-5 bg-[#2d2d38]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Título do Comunicado</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite o título do comunicado" 
                          className="bg-[#353542] border-0 focus:ring-1 focus:ring-blue-500 text-white placeholder:text-gray-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Mensagem</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Digite a mensagem do comunicado" 
                          className="min-h-[120px] bg-[#353542] border-0 focus:ring-1 focus:ring-blue-500 text-white placeholder:text-gray-500 resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Área Responsável</FormLabel>
                        <Select
                          disabled={!!user?.actingDepartment}
                          onValueChange={field.onChange}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#353542] border-0 focus:ring-1 focus:ring-blue-500 text-white">
                              <SelectValue placeholder="Selecione a área" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#353542] border border-gray-700 text-white">
                            {departmentOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="focus:bg-blue-600/20 focus:text-blue-200">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {user?.actingDepartment && (
                          <FormDescription className="text-gray-400">
                            Sua conta está restrita a criar comunicados apenas para esta área.
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Categoria da Mensagem</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#353542] border-0 focus:ring-1 focus:ring-blue-500 text-white">
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#353542] border border-gray-700 text-white">
                            {categoryOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="focus:bg-blue-600/20 focus:text-blue-200">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="targetedLocations"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-white">Direcionamento Geográfico (Locais)</FormLabel>
                        <FormDescription className="text-gray-400">
                          Selecione para quais locais este comunicado será visível.
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {locationOptions.map((option) => (
                          <FormField
                            key={option.value}
                            control={form.control}
                            name="targetedLocations"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={option.value}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      className="border-gray-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                      checked={field.value?.includes(option.value)}
                                      onCheckedChange={(checked) => {
                                        const updatedValues = checked
                                          ? [...field.value, option.value]
                                          : field.value?.filter(
                                              (value) => value !== option.value
                                            );
                                        field.onChange(updatedValues);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal text-gray-300">
                                    {option.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormItem>
                  <FormLabel className="text-white">Anexo (PDF)</FormLabel>
                  <div className="mt-1 flex justify-center px-6 py-5 border border-gray-700 border-dashed rounded bg-[#353542]/50">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-10 w-10 text-blue-300 opacity-75" />
                      <div className="flex flex-wrap justify-center gap-1 text-sm text-gray-400">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none"
                        >
                          <span>Carregar um arquivo</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            accept=".pdf"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p>ou arraste e solte</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF até 10MB</p>
                      {form.watch("attachment") && (
                        <p className="text-sm text-blue-300">
                          {(form.watch("attachment") as File).name}
                        </p>
                      )}
                    </div>
                  </div>
                </FormItem>
                
                <div className="flex justify-end pt-2">
                  <Button 
                    type="submit" 
                    className="h-9 text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={registerAnnouncementMutation.isPending}
                  >
                    {registerAnnouncementMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      "Registrar Comunicado"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
