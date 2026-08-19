
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let result;
      console.log("Attempting to", isSignUp ? "sign up" : "sign in", "with email:", email);
      
      if (isSignUp) {
        // Vérification que l'email contient "admin" pour la création de compte
        if (!email.toLowerCase().includes('admin')) {
          setError("Seuls les comptes avec 'admin' dans l'email peuvent être créés.");
          setIsLoading(false);
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

        console.log("Sign up result:", result);

        if (result.error) {
          throw result.error;
        }

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
        console.log("Attempting login with:", { email, password: "***" });
        result = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        console.log("Sign in result:", result);

        if (result.error) {
          throw result.error;
        }
      }

      if (result.data.user) {
        onLoginSuccess(result.data.user);
        onClose();
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      // Messages d'erreur plus clairs et localisés
      if (error.message === "Invalid login credentials") {
        setError("Identifiants invalides. Vérifiez votre email et mot de passe.");
      } else if (error.message.includes("Email not confirmed")) {
        setError("Email non confirmé. Veuillez vérifier votre boîte mail pour confirmer votre compte.");
      } else if (error.message.includes("Email already registered")) {
        setError("Cet email est déjà enregistré. Veuillez vous connecter ou utiliser un autre email.");
      } else {
        setError(error.message || "Une erreur s'est produite lors de l'authentification.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setError(null);
    setEmail("");
    setPassword("");
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isSignUp ? "Création de compte admin" : "Connexion admin"}</DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de connexion</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
            <Input
              id="password"
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="w-full"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Traitement en cours..." : isSignUp ? "Créer un compte" : "Se connecter"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              disabled={isLoading}
            >
              {isSignUp ? "Déjà un compte ?" : "Créer un compte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
