
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, User, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Schéma de validation
const loginFormSchema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

// Schéma de validation pour l'inscription
const signupFormSchema = z.object({
  fullName: z.string().min(3, "Le nom complet doit contenir au moins 3 caractères"),
  email: z.string().email("Veuillez entrer une adresse email valide"),
  phoneNumber: z.string().min(9, "Le numéro de téléphone doit contenir au moins 9 chiffres"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type SignupFormValues = z.infer<typeof signupFormSchema>;

interface PaymentLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userData: any) => void;
  price: number;
  details?: string;
}

export const PaymentLoginDialog: React.FC<PaymentLoginDialogProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  price,
  details
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Connexion avec Supabase
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      if (authData.user) {
        // Récupérer les informations utilisateur depuis la table users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', data.email)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error("Erreur lors de la récupération des données utilisateur:", userError);
          
          // Create user record if it doesn't exist
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              { 
                id: authData.user.id,
                email: data.email,
                name: authData.user.user_metadata?.name || "Utilisateur",
                phone: authData.user.user_metadata?.phone || "",
              }
            ]);
            
          if (insertError) {
            console.error("Erreur lors de l'ajout de l'utilisateur:", insertError);
          }
        }

        // Connexion réussie
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté à votre compte.",
        });

        // Passer les données utilisateur au parent
        onLoginSuccess({
          id: authData.user.id,
          email: authData.user.email,
          phoneNumber: userData?.phone || authData.user.user_metadata?.phone || "",
          fullName: userData?.name || authData.user.user_metadata?.name || "Utilisateur"
        });
      }
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Une erreur est survenue lors de la connexion.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Espace client</DialogTitle>
          <DialogDescription>
            {price > 0 ? 
              `Veuillez vous connecter pour finaliser votre paiement de ${Math.round(price)} FCFA${details ? ` pour ${details}` : ''}.` :
              "Connectez-vous à votre compte ou créez-en un nouveau pour accéder à toutes les fonctionnalités."
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="login">Se connecter</TabsTrigger>
            <TabsTrigger value="signup">Créer un compte</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginTab 
              form={loginForm} 
              onSubmit={onLoginSubmit} 
              isLoading={isLoading} 
              onClose={onClose} 
              setActiveTab={setActiveTab}
            />
          </TabsContent>
          
          <TabsContent value="signup">
            <SignupTab 
              onSignupSuccess={onLoginSuccess}
              price={price}
              details={details}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              onClose={onClose}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

interface LoginTabProps {
  form: any;
  onSubmit: (data: LoginFormValues) => void;
  isLoading: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

const LoginTab: React.FC<LoginTabProps> = ({ form, onSubmit, isLoading, onClose, setActiveTab }) => {
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="exemple@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button type="submit" className="bg-restaurant-purple hover:bg-restaurant-red transition-colors" disabled={isLoading}>
              <LogIn className="mr-2 h-4 w-4" />
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
        <p className="font-semibold text-yellow-800">Pas encore de compte ?</p>
        <p className="text-yellow-700 mt-1">
          <Button 
            variant="link" 
            className="p-0 h-auto text-yellow-800 underline" 
            onClick={() => setActiveTab("signup")}
          >
            Créez un compte
          </Button> 
          {" "}aujourd'hui et bénéficiez de promotions exclusives sur nos menus hebdomadaires.
        </p>
      </div>
    </>
  );
};

interface SignupTabProps {
  onSignupSuccess: (userData: any) => void;
  price: number;
  details?: string;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
}

const SignupTab: React.FC<SignupTabProps> = ({ 
  onSignupSuccess, 
  price, 
  details, 
  isLoading, 
  setIsLoading, 
  onClose 
}) => {
  const { toast } = useToast();
  
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      // Inscription avec Supabase
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.fullName,
            phone: data.phoneNumber,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (authData.user) {
        // Ajouter l'utilisateur à la table users
        const { error: userError } = await supabase
          .from('users')
          .insert([
            { 
              id: authData.user.id,
              email: data.email,
              name: data.fullName,
              phone: data.phoneNumber,
            }
          ]);

        if (userError) {
          console.error("Erreur lors de l'ajout de l'utilisateur:", userError);
        }

        // Inscription réussie
        toast({
          title: "Inscription réussie",
          description: "Votre compte a été créé avec succès.",
        });

        // Passer les données utilisateur au parent
        onSignupSuccess({
          id: authData.user.id,
          email: data.email,
          phoneNumber: data.phoneNumber,
          fullName: data.fullName
        });
      }
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue lors de l'inscription.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet</FormLabel>
                <FormControl>
                  <Input placeholder="Prénom et Nom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="exemple@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de téléphone</FormLabel>
                <FormControl>
                  <Input placeholder="70 123 45 67" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button type="submit" className="bg-restaurant-purple hover:bg-restaurant-red transition-colors" disabled={isLoading}>
              <UserPlus className="mr-2 h-4 w-4" />
              {isLoading ? "Création..." : "Créer un compte"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
        <p className="font-semibold text-yellow-800">Avantages exclusifs !</p>
        <p className="text-yellow-700 mt-1">En créant un compte, vous recevrez des notifications sur nos promotions et aurez accès à des menus exclusifs réservés aux membres.</p>
      </div>
    </>
  );
};
