
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export const AdminLoginDialog: React.FC<AdminLoginDialogProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let result;
      if (isSignUp) {
        // Vérification que l'email contient "admin" pour la création de compte
        if (!email.toLowerCase().includes('admin')) {
          toast({
            title: "Création refusée",
            description: "Seuls les comptes avec 'admin' dans l'email peuvent être créés.",
            variant: "destructive"
          });
          return;
        }

        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'admin'
            }
          }
        });

        if (result.data.user) {
          // Ajouter le rôle admin automatiquement
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({ 
              user_id: result.data.user.id, 
              role: 'admin' 
            });

          if (roleError) {
            console.error("Erreur lors de l'ajout du rôle admin:", roleError);
          }

          toast({
            title: "Compte admin créé",
            description: "Votre compte administrateur a été créé avec succès.",
          });
        }
      } else {
        // Connexion standard
        result = await supabase.auth.signInWithPassword({
          email,
          password
        });
      }

      if (result.data.user) {
        onLoginSuccess(result.data.user);
        onClose();
      } else if (result.error) {
        toast({
          title: "Erreur de connexion",
          description: result.error.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isSignUp ? "Création de compte admin" : "Connexion admin"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-between items-center">
            <Button type="submit">
              {isSignUp ? "Créer un compte" : "Se connecter"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Déjà un compte ?" : "Créer un compte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
