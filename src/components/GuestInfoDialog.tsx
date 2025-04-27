
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const guestInfoSchema = z.object({
  fullName: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  phoneNumber: z.string().min(9, "Le numéro de téléphone doit contenir au moins 9 chiffres"),
});

type GuestInfoFormValues = z.infer<typeof guestInfoSchema>;

interface GuestInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GuestInfoFormValues) => void;
  price: number;
  details?: string;
}

export const GuestInfoDialog: React.FC<GuestInfoDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  price,
  details
}) => {
  const form = useForm<GuestInfoFormValues>({
    resolver: zodResolver(guestInfoSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
    },
  });

  const handleSubmit = (data: GuestInfoFormValues) => {
    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Information de contact</DialogTitle>
          <DialogDescription>
            {price > 0 ? 
              `Veuillez renseigner vos informations pour finaliser votre paiement de ${Math.round(price)} FCFA${details ? ` pour ${details}` : ''}.` :
              "Veuillez renseigner vos informations de contact."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
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

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                type="submit" 
                className="bg-restaurant-purple hover:bg-restaurant-red transition-colors"
              >
                Continuer vers le paiement
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
