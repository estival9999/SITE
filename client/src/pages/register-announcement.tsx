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
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/announcements", data);
      return await res.json();
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
      
      if (data.attachment) {
        formData.append("attachment", data.attachment);
      }
      
      // Log FormData contents for debugging
      console.log("FormData contents:");
      console.log("title:", formData.get("title"));
      console.log("message:", formData.get("message"));
      console.log("department:", formData.get("department"));
      console.log("category:", formData.get("category"));

      registerAnnouncementMutation.mutate(formData);
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
      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Comunicado</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o título do comunicado" {...field} />
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
                    <FormLabel>Mensagem</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Digite a mensagem do comunicado" 
                        className="min-h-[120px]" 
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
                      <FormLabel>Área Responsável</FormLabel>
                      <Select
                        disabled={!!user?.actingDepartment}
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a área" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departmentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {user?.actingDepartment && (
                        <FormDescription>
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
                      <FormLabel>Categoria da Mensagem</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
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
                      <FormLabel>Direcionamento Geográfico (Locais)</FormLabel>
                      <FormDescription>
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
                                <FormLabel className="font-normal">
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
                <FormLabel>Anexo (PDF)</FormLabel>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-[#5e8c6a] hover:text-[#88a65e] focus-within:outline-none"
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
                      <p className="pl-1">ou arraste e solte</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF até 10MB</p>
                    {form.watch("attachment") && (
                      <p className="text-sm text-[#5e8c6a]">
                        {(form.watch("attachment") as File).name}
                      </p>
                    )}
                  </div>
                </div>
              </FormItem>
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-[#5e8c6a] hover:bg-[#88a65e]"
                  disabled={registerAnnouncementMutation.isPending}
                >
                  {registerAnnouncementMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Registrar Comunicado"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
