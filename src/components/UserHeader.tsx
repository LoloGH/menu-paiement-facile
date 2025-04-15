import React, { useState, useEffect } from 'react';
import { User, LogIn, LogOut, Settings, ShoppingBag } from 'lucide-react';
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session && session.user) {
          setIsLoggedIn(true);
          
          try {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              if (error.code !== 'PGRST116') {
                console.error("Erreur lors de la récupération des données utilisateur:", error);
              }
              
              const { error: insertError } = await supabase
                .from('users')
                .insert([
                  { 
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.full_name || "Utilisateur",
                    phone: session.user.user_metadata?.phone || "",
                  }
                ]);
                
              if (insertError) {
                console.error("Erreur lors de l'ajout de l'utilisateur:", insertError);
              }
              
              setUserData({
                id: session.user.id,
                email: session.user.email,
                fullName: session.user.user_metadata?.full_name || "Utilisateur",
                phoneNumber: session.user.user_metadata?.phone || "",
              });
            } else {
              setUserData({
                id: data.id,
                email: data.email,
                fullName: data.name || "Utilisateur",
                phoneNumber: data.phone || "",
              });
            }
          } catch (err) {
            console.error("Erreur lors de la gestion des données utilisateur:", err);
            setUserData({
              id: session.user.id,
              email: session.user.email,
              fullName: "Utilisateur",
              phoneNumber: "",
            });
          }
        } else {
          setIsLoggedIn(false);
          setUserData(null);
        }
      }
    );

    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setIsLoggedIn(true);
        
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            if (error.code !== 'PGRST116') {
              console.error("Erreur lors de la récupération des données utilisateur:", error);
            }
            
            const { error: insertError } = await supabase
              .from('users')
              .insert([
                { 
                  id: session.user.id,
                  email: session.user.email,
                  name: session.user.user_metadata?.full_name || "Utilisateur",
                  phone: session.user.user_metadata?.phone || "",
                }
              ]);
              
            if (insertError) {
              console.error("Erreur lors de l'ajout de l'utilisateur:", insertError);
            }
            
            setUserData({
              id: session.user.id,
              email: session.user.email,
              fullName: session.user.user_metadata?.full_name || "Utilisateur",
              phoneNumber: session.user.user_metadata?.phone || "",
            });
          } else {
            setUserData({
              id: data.id,
              email: data.email,
              fullName: data.name || "Utilisateur",
              phoneNumber: data.phone || "",
            });
          }
        } catch (err) {
          console.error("Erreur lors de la gestion des données utilisateur:", err);
          setUserData({
            id: session.user.id,
            email: session.user.email,
            fullName: "Utilisateur",
            phoneNumber: "",
          });
        }
      }
    };

    checkCurrentSession();

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
                <Link to="/profile" className="block w-full">
                  <Button 
                    variant="outline" 
                    className="w-full text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Gérer mon profil
                  </Button>
                </Link>
                <Link to="/mes-commandes" className="block w-full">
                  <Button 
                    variant="outline" 
                    className="w-full text-gray-700 hover:bg-gray-100"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Mes commandes
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
