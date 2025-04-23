
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, LogOut, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Badge } from "@/components/ui/badge";

interface KitchenHeaderProps {
  hasNewOrder: boolean;
  setHasNewOrder: (value: boolean) => void;
}

export const KitchenHeader: React.FC<KitchenHeaderProps> = ({ hasNewOrder, setHasNewOrder }) => {
  const { adminData, handleLogout } = useAdminAuth();

  const handleAcknowledge = () => {
    setHasNewOrder(false);
  };
  
  return (
    <header className="bg-restaurant-purple text-white p-4 shadow-md">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center">
            <div className="bg-white p-2 rounded-md mr-3">
              <img 
                src="/lovable-uploads/5936ebd2-a679-4024-b0c9-40785b7dcf47.png"
                alt="Logo"
                className="h-10 w-auto"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold">Interface Cuisine</h1>
              <div className="text-sm opacity-75">
                Connecté en tant que: {adminData?.email}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasNewOrder && (
              <Button 
                className="bg-restaurant-red text-white flex items-center" 
                onClick={handleAcknowledge}
              >
                <Bell className="h-4 w-4 mr-2" />
                Nouvelles commandes
              </Button>
            )}
            
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleLogout}
              className="bg-restaurant-red hover:bg-restaurant-red/80"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
            
            <Link to="/interface-admin" className="flex items-center text-white hover:text-gray-200 transition">
              <ChevronLeft className="w-5 h-5 mr-1" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
