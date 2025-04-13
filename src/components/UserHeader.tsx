
import React, { useState, useEffect } from 'react';
import { User, LogIn, LogOut, Database } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { PaymentLoginDialog } from './PaymentLoginDialog';
import { supabase } from "@/integrations/supabase/client";
import { Link } from 'react-router-dom';

interface UserHeaderProps {
  className?: string;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ className }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const { toast } = useToast();

  // Vérifier l'état de la session au chargement et écouter les changements
  useEffect(() => {
    // Fonction pour récupérer les données utilisateur
    const getUserData = async (userId: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error);
        return null;
      }
      
      return data;
    };

    // Configurer l'écouteur d'événements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session && session.user) {
          const profile = await getUserData(session.user.id);
          setIsLoggedIn(true);
          setUserData({
            id: session.user.id,
            email: session.user.email,
            fullName: profile?.name || "Utilisateur",
            phoneNumber: profile?.phone || "",
          });
        } else {
          setIsLoggedIn(false);
          setUserData(null);
        }
      }
    );

    // Vérifier la session actuelle au chargement
    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const profile = await getUserData(session.user.id);
        setIsLoggedIn(true);
        setUserData({
          id: session.user.id,
          email: session.user.email,
          fullName: profile?.name || "Utilisateur",
          phoneNumber: profile?.phone || "",
        });
      }
    };

    checkCurrentSession();

    // Nettoyage à la destruction du composant
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = () => {
    setIsLoginDialogOpen(true);
  };

  const handleLoginSuccess = (user: any) => {
    setIsLoginDialogOpen(false);
    setIsLoggedIn(true);
    setUserData(user);
    
    toast({
      title: "Connexion réussie",
      description: "Vous êtes maintenant connecté à votre compte.",
    });
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Erreur de déconnexion:", error);
      toast({
        title: "Erreur",
        description: "Un problème est survenu lors de la déconnexion.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoggedIn(false);
    setUserData(null);
    
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
              <span className="font-medium">{userData?.fullName}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-4">
            <div className="space-y-4">
              <h3 className="font-medium text-center mb-2 text-restaurant-purple">Espace Client</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="flex items-center">
                  <span className="font-semibold mr-2">Nom:</span> {userData?.fullName}
                </p>
                <p className="flex items-center">
                  <span className="font-semibold mr-2">Email:</span> {userData?.email}
                </p>
                {userData?.phoneNumber && (
                  <p className="flex items-center">
                    <span className="font-semibold mr-2">Téléphone:</span> {userData.phoneNumber}
                  </p>
                )}
                <p className="flex items-center">
                  <span className="font-semibold mr-2">Statut:</span> 
                  <span className="text-green-600 font-medium">Actif</span>
                </p>
              </div>
              <div className="pt-2 border-t space-y-2">
                <Link to="/admin" className="block w-full">
                  <Button 
                    variant="outline" 
                    className="w-full text-gray-700 hover:bg-gray-100"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Interface Admin
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full text-gray-700 hover:bg-gray-100"
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
