
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const orderSchema = z.object({
  payment_status: z.string(),
  details: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderFormProps {
  initialData?: any;
  onSubmit: (data: OrderFormValues) => void;
  onCancel: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      payment_status: initialData?.payment_status || "pending",
      details: initialData?.details || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="payment_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut de la commande</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="validated">Validée</SelectItem>
                  <SelectItem value="preparing">En préparation</SelectItem>
                  <SelectItem value="delivered">Livrée</SelectItem>
                  <SelectItem value="completed">Complétée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                  <SelectItem value="failed">Échouée</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Détails</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Détails supplémentaires sur la commande" 
                  {...field} 
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            Mettre à jour
          </Button>
        </div>
      </form>
    </Form>
  );
};
