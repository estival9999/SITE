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
import { FilterIcon, Search, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <div className="mb-5 bg-[#353542] rounded-lg overflow-hidden shadow">
          <div className="flex flex-wrap items-center p-3 gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Input
                placeholder="Buscar comunicados..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-3 pr-9 bg-[#2d2d38] border-0 text-white rounded focus:ring-1 focus:ring-blue-500 placeholder:text-gray-500 text-sm"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                <Search className="h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={toggleFilters}
              className={cn("flex items-center h-9 px-3 py-1.5 text-gray-300 rounded text-sm transition-colors",
                showFilters ? "bg-blue-500/20 text-blue-300" : "hover:bg-[#2d2d38]"
              )}
              size="sm"
            >
              <FilterIcon className="h-3.5 w-3.5 mr-1.5" />
              Filtros
            </Button>
          </div>
          
          {showFilters && (
            <div className="bg-[#2d2d38] p-3 border-t border-gray-700/30">
              <FiltersPanel 
                onApplyFilters={applyFilters} 
                showLocationFilter={user?.role === UserRole.ADMIN}
                currentFilters={filters}
              />
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-2" />
              <span className="text-sm text-gray-400">Carregando comunicados...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-[#331a1e] rounded-lg p-4 text-red-300">
            <p className="flex items-center text-sm">
              <X className="h-4 w-4 mr-2 text-red-400 flex-shrink-0" />
              Erro ao carregar comunicados. Tente novamente mais tarde.
            </p>
          </div>
        ) : (
          <div className="space-y-3 w-full">
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
              <div className="p-6 bg-[#2d2d38] rounded-lg text-center">
                <p className="text-gray-400 text-sm">Nenhum comunicado encontrado.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
