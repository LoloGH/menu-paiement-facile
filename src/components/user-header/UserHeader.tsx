
import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PaymentLoginDialog } from '../PaymentLoginDialog';
import { UserProfilePopover } from './UserProfilePopover';
import { useUserAuth } from '@/hooks/use-user-auth';

interface UserHeaderProps {
  className?: string;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ className }) => {
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const { isLoggedIn, userData, isLoading, handleLogout } = useUserAuth();
  const { toast } = useToast();

  const handleLogin = () => {
    setIsLoginDialogOpen(true);
  };

  const handleLoginSuccess = () => {
    setIsLoginDialogOpen(false);
    
    toast({
      title: "Connexion réussie",
      description: "Vous êtes maintenant connecté à votre compte.",
    });
  };

  if (isLoading) {
    return (
      <div className={className}>
        <Button variant="outline" className="bg-gray-200 text-gray-400" disabled>
          <LogIn className="h-4 w-4 mr-2" />
          Chargement...
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {isLoggedIn && userData ? (
        <UserProfilePopover 
          userData={userData} 
          onLogout={handleLogout} 
        />
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
