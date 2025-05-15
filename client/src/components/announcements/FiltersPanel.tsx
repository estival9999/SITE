import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Department, Category, Location } from "@shared/schema";

interface FiltersPanelProps {
  onApplyFilters: (filters: {
    department?: Department;
    category?: Category;
    location?: Location;
  }) => void;
  showLocationFilter: boolean;
  currentFilters: {
    department?: Department;
    category?: Category;
    location?: Location;
  };
}

export default function FiltersPanel({ 
  onApplyFilters, 
  showLocationFilter,
  currentFilters
}: FiltersPanelProps) {
  const [department, setDepartment] = useState<Department | undefined>(currentFilters.department);
  const [category, setCategory] = useState<Category | undefined>(currentFilters.category);
  const [location, setLocation] = useState<Location | undefined>(currentFilters.location);

  // Update local state when currentFilters change
  useEffect(() => {
    setDepartment(currentFilters.department);
    setCategory(currentFilters.category);
    setLocation(currentFilters.location);
  }, [currentFilters]);

  const handleApplyFilters = () => {
    onApplyFilters({
      department,
      category,
      location,
    });
  };

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

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="filterDepartment" className="block text-sm font-medium text-gray-700 mb-1">
              Área Responsável
            </label>
            <Select 
              value={department} 
              onValueChange={(value: Department) => setDepartment(value)}
            >
              <SelectTrigger id="filterDepartment" className="w-full">
                <SelectValue placeholder="Todas as áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as áreas</SelectItem>
                {departmentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <Select 
              value={category} 
              onValueChange={(value: Category) => setCategory(value)}
            >
              <SelectTrigger id="filterCategory" className="w-full">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {showLocationFilter && (
            <div>
              <label htmlFor="filterLocation" className="block text-sm font-medium text-gray-700 mb-1">
                Local
              </label>
              <Select 
                value={location} 
                onValueChange={(value: Location) => setLocation(value)}
              >
                <SelectTrigger id="filterLocation" className="w-full">
                  <SelectValue placeholder="Todos os locais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os locais</SelectItem>
                  {locationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button 
            className="bg-[#5e8c6a] hover:bg-[#88a65e]"
            onClick={handleApplyFilters}
          >
            Aplicar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
