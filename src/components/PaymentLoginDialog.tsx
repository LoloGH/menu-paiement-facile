
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, User } from "lucide-react";

// Schéma de validation
const formSchema = z.object({
  email: z.string().email("Entrez une adresse email valide"),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="votre@email.com" {...field} />
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
          <p className="text-sm text-muted-foreground mb-2">Vous n'avez pas de compte ?</p>
          <Button variant="outline" onClick={onClose} className="w-full">
            <User className="mr-2 h-4 w-4" />
            Créer un compte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
