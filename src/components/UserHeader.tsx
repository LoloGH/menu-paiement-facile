
import React, { useState } from 'react';
import { User, LogIn, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { PaymentLoginDialog } from './PaymentLoginDialog';

interface UserHeaderProps {
  className?: string;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ className }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    setIsLoginDialogOpen(true);
  };

  const handleLoginSuccess = () => {
    setIsLoginDialogOpen(false);
    // Simuler la connexion
    setIsLoggedIn(true);
    setUserName('Client Axess');
    
    toast({
      title: "Connexion réussie",
      description: "Vous êtes maintenant connecté à votre compte.",
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté de votre compte.",
    });
  };

  return (
    <div className={className}>
      {isLoggedIn ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-white hover:bg-gray-100">
              <User className="h-4 w-4 mr-2" />
              <span className="font-medium">{userName}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-4">
            <div className="space-y-4">
              <h3 className="font-medium text-center mb-2 text-restaurant-purple">Espace Client</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="flex items-center">
                  <span className="font-semibold mr-2">Nom:</span> {userName}
                </p>
                <p className="flex items-center">
                  <span className="font-semibold mr-2">Statut:</span> 
                  <span className="text-green-600 font-medium">Actif</span>
                </p>
              </div>
              <div className="pt-2 border-t">
                <Button 
                  variant="outline" 
                  className="w-full mt-2 text-gray-700 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <Button 
          variant="outline" 
          className="bg-restaurant-red text-white hover:bg-restaurant-red/80"
          onClick={handleLogin}
        >
          <LogIn className="h-4 w-4 mr-2" />
          Connexion
        </Button>
      )}

      <PaymentLoginDialog 
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        price={0}
        details="Connexion à l'espace client"
      />
    </div>
  );
};
