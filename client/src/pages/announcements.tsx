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
        <div className="mb-8 bg-[#1c1c28] rounded-xl p-5 shadow-lg border border-[#2a2a3a]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3 flex-grow">
              <div className="relative flex-1 min-w-[250px] max-w-md">
                <Input
                  placeholder="Buscar comunicados..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-4 pr-10 bg-[#13131d] border-[#3b3b4f] text-white rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Search className="h-4 w-4 text-blue-400" />
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={toggleFilters}
                className="flex items-center h-10 px-4 py-2 bg-[#13131d] text-blue-400 border border-[#3b3b4f] hover:bg-[#1e1e2f] hover:text-blue-300 rounded-lg transition-colors duration-200"
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[#2a2a3a]">
              <FiltersPanel 
                onApplyFilters={applyFilters} 
                showLocationFilter={user?.role === UserRole.ADMIN}
                currentFilters={filters}
              />
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center my-12">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="bg-[#331a1e] border border-red-900 rounded-xl p-5 text-red-300 shadow-md">
            <p className="flex items-center">
              <X className="h-5 w-5 mr-2 text-red-400" />
              Erro ao carregar comunicados. Tente novamente mais tarde.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 w-full">
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
              <div className="p-8 bg-[#1c1c28] rounded-xl shadow-md border border-[#2a2a3a] text-center">
                <p className="text-gray-300">Nenhum comunicado encontrado.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
