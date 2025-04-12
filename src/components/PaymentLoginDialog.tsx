
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, User, UserPlus } from "lucide-react";

// Schéma de validation
const formSchema = z.object({
  phoneNumber: z.string().min(9, "Le numéro de téléphone doit contenir au moins 9 chiffres"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
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
  const [showSignup, setShowSignup] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // Ici, nous simulons simplement une connexion réussie
      // Dans une implémentation réelle, vous connecteriez à une API d'authentification
      console.log("Connexion avec:", data);
      
      // Simuler un délai de traitement
      setTimeout(() => {
        setIsLoading(false);
        // Connexion réussie
        onLoginSuccess();
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      console.error("Erreur de connexion:", error);
    }
  };

  const handleCreateAccount = () => {
    setShowSignup(true);
  };

  const handleBackToLogin = () => {
    setShowSignup(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {!showSignup ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Connexion requise</DialogTitle>
              <DialogDescription>
                Veuillez vous connecter pour finaliser votre paiement de {price.toFixed(0)} FCFA
                {details ? ` pour ${details}` : ''}.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
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
                    <LogIn className="mr-2 h-4 w-4" />
                    {isLoading ? "Connexion..." : "Se connecter"}
                  </Button>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Annuler
                  </Button>
                </div>
              </form>
            </Form>

            <div className="border-t pt-4 mt-2">
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                <p className="font-semibold text-yellow-800">Offre spéciale pour les nouveaux comptes !</p>
                <p className="text-yellow-700 mt-1">Créez un compte aujourd'hui et bénéficiez de promotions exclusives sur nos menus hebdomadaires. Ne manquez pas nos offres à venir !</p>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Vous n'avez pas de compte ?</p>
              <Button onClick={handleCreateAccount} variant="outline" className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                Créer un compte
              </Button>
            </div>
          </>
        ) : (
          <SignupForm 
            onBackToLogin={handleBackToLogin} 
            onSignupSuccess={onLoginSuccess}
            price={price}
            details={details}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

// Schéma de validation pour l'inscription
const signupFormSchema = z.object({
  fullName: z.string().min(3, "Le nom complet doit contenir au moins 3 caractères"),
  phoneNumber: z.string().min(9, "Le numéro de téléphone doit contenir au moins 9 chiffres"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

interface SignupFormProps {
  onBackToLogin: () => void;
  onSignupSuccess: () => void;
  price: number;
  details?: string;
}

const SignupForm: React.FC<SignupFormProps> = ({ onBackToLogin, onSignupSuccess, price, details }) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      // Ici, nous simulons simplement une inscription réussie
      console.log("Inscription avec:", data);
      
      // Simuler un délai de traitement
      setTimeout(() => {
        setIsLoading(false);
        // Inscription réussie
        onSignupSuccess();
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      console.error("Erreur d'inscription:", error);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">Créer un compte</DialogTitle>
        <DialogDescription>
          Créez votre compte pour finaliser votre paiement de {price.toFixed(0)} FCFA
          {details ? ` pour ${details}` : ''} et profiter de nos offres spéciales.
        </DialogDescription>
      </DialogHeader>

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
            <Button type="button" variant="outline" onClick={onBackToLogin}>
              Retour
            </Button>
          </div>
        </form>
      </Form>

      <div className="border-t pt-4 mt-2">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
          <p className="font-semibold text-yellow-800">Avantages exclusifs !</p>
          <p className="text-yellow-700 mt-1">En créant un compte, vous recevrez des notifications sur nos promotions et aurez accès à des menus exclusifs réservés aux membres.</p>
        </div>
      </div>
    </>
  );
};
