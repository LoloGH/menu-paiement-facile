
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Bell, BellOff } from "lucide-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";

interface KitchenHeaderProps {
  hasNewOrder: boolean;
  setHasNewOrder: React.Dispatch<React.SetStateAction<boolean>>;
}

export const KitchenHeader: React.FC<KitchenHeaderProps> = ({ 
  hasNewOrder, 
  setHasNewOrder 
}) => {
  const { adminData, handleLogout } = useAdminAuth();

  const acknowledgeNewOrders = () => {
    setHasNewOrder(false);
  };

  return (
    <header className="bg-restaurant-purple text-white p-4 shadow-md">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-white p-2 rounded-md mr-3">
              <img 
                src="/lovable-uploads/5936ebd2-a679-4024-b0c9-40785b7dcf47.png"
                alt="Logo"
                className="h-10 w-auto"
              />
            </div>
            <h1 className="text-2xl font-bold">Interface Cuisine</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {hasNewOrder && (
              <Button 
                onClick={acknowledgeNewOrders}
                variant="outline"
                size="sm"
                className="bg-white text-restaurant-purple hover:bg-gray-100"
              >
                <BellOff className="h-4 w-4 mr-2" />
                Acquitter
              </Button>
            )}
            
            <div className="text-sm bg-white/20 px-3 py-1 rounded hidden md:block">
              Admin: {adminData?.email}
            </div>
            
            <Link 
              to="/interface-admin" 
              className="flex items-center text-white hover:text-gray-200 transition"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              <span className="hidden md:inline">Retour à l'administration</span>
              <span className="inline md:hidden">Retour</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
