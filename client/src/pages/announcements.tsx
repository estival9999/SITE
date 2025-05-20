import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/layouts/AppLayout";
import AnnouncementCard from "@/components/announcements/AnnouncementCard";
import FiltersPanel from "@/components/announcements/FiltersPanel";
import { Announcement, Category, Department, Location, UserRole } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterIcon, Search, Loader2 } from "lucide-react";

export default function Announcements() {
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    department?: Department;
    category?: Category;
    location?: Location;
  }>({});

  // Fetch announcements data
  const { data: announcements, isLoading, error } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const toggleFilters = () => setShowFilters(!showFilters);

  const applyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  // Filter announcements based on user role, assigned locations, and selected filters
  const filteredAnnouncements = announcements?.filter((announcement) => {
    // For readers, only show announcements targeted to their assigned locations
    if (user?.role === UserRole.READER && user.assignedLocations?.length) {
      const userLocations = user.assignedLocations as Location[];
      const announcementLocations = announcement.targetedLocations as Location[];
      
      // Check if there's any overlap between user's locations and announcement's locations
      if (!userLocations.some(loc => announcementLocations.includes(loc))) {
        return false;
      }
    }

    // Apply department filter
    if (filters.department && announcement.department !== filters.department) {
      return false;
    }

    // Apply category filter
    if (filters.category && announcement.category !== filters.category) {
      return false;
    }

    // Apply location filter (only for admins)
    if (filters.location && user?.role === UserRole.ADMIN) {
      const announcementLocations = announcement.targetedLocations as Location[];
      if (!announcementLocations.includes(filters.location)) {
        return false;
      }
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        announcement.title.toLowerCase().includes(query) ||
        announcement.message.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <AppLayout title="Caixa de Comunicados">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold text-white mb-2 md:mb-0">Caixa de Comunicados</h2>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleFilters}
              className="flex items-center"
            >
              <FilterIcon className="h-4 w-4 mr-1" />
              Filtros
            </Button>
            
            <div className="relative flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar comunicados..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-3 pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        
        {showFilters && (
          <FiltersPanel 
            onApplyFilters={applyFilters} 
            showLocationFilter={user?.role === UserRole.ADMIN}
            currentFilters={filters}
          />
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center my-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#5e8c6a]" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
            <p>Erro ao carregar comunicados. Tente novamente mais tarde.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            {filteredAnnouncements && filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((announcement) => (
                <AnnouncementCard 
                  key={announcement.id} 
                  announcement={announcement} 
                  isAdmin={user?.role === UserRole.ADMIN}
                  isCreator={user?.id === announcement.authorId}
                />
              ))
            ) : (
              <div className="col-span-full p-8 bg-white rounded-lg shadow text-center">
                <p className="text-gray-500">Nenhum comunicado encontrado.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
