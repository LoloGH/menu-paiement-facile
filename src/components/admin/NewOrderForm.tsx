
import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, UserPlus, Users } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { globalTaskQueue } from '@/utils/backgroundWorker';

// Définir le schéma de validation pour le formulaire
const orderSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  paymentStatus: z.string().default("pending"),
  table: z.string().optional(),
  items: z.string().optional(),
  note: z.string().optional(),
  totalAmount: z.coerce.number().min(0, { message: "Le montant doit être positif" }),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface NewOrderFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const NewOrderForm: React.FC<NewOrderFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const { toast } = useToast();
  const [existingClients, setExistingClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer la liste des clients existants
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true);
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .order("name", { ascending: true });

        if (error) throw error;
        setExistingClients(data || []);
        setFilteredClients(data || []);
      } catch (error: any) {
        console.error("Erreur lors de la récupération des clients:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les clients",
          variant: "destructive",
        });
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, [toast]);

  // Filtrer les clients en fonction du terme de recherche
  useEffect(() => {
    if (clientSearchTerm.trim() === "") {
      setFilteredClients(existingClients);
      return;
    }

    const filtered = existingClients.filter((client) =>
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      (client.phone && client.phone.includes(clientSearchTerm)) ||
      (client.loyalty_number && client.loyalty_number.includes(clientSearchTerm))
    );
    setFilteredClients(filtered);
  }, [clientSearchTerm, existingClients]);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      clientId: "",
      clientName: "",
      clientPhone: "",
      paymentStatus: "pending",
      table: "",
      items: "",
      note: "",
      totalAmount: 0,
    },
  });

  const handleSubmitForm = async (formData: OrderFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Traiter les données au format approprié pour la base de données
      let clientId = formData.clientId;
      
      // Si aucun client existant n'est sélectionné mais que des informations client sont fournies, 
      // créer un nouveau client
      if (!clientId && formData.clientName) {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            name: formData.clientName,
            phone: formData.clientPhone || null
          })
          .select("id")
          .single();
        
        if (clientError) throw clientError;
        clientId = newClient.id;
      }
      
      // Détails de la commande
      const details = {
        table: formData.table,
        items: formData.items,
        note: formData.note,
        client: formData.clientName || ""
      };
      
      // Générer un ID de reçu unique (format: MM-YYYY-XXXX)
      const now = new Date();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // Génère un nombre à 4 chiffres
      const receiptId = `${month}-${year}-${randomSuffix}`;
      
      // Créer la commande
      const orderData = {
        client_id: clientId || null,
        guest_name: !clientId ? formData.clientName : null,
        guest_phone: !clientId ? formData.clientPhone : null,
        payment_status: formData.paymentStatus,
        total_amount: formData.totalAmount,
        details: JSON.stringify(details),
        receipt_id: receiptId,
      };
      
      // Soumettre les données au parent pour traitement final
      await onSubmit(orderData);
      
    } catch (error: any) {
      console.error("Erreur lors de la création de la commande:", error);
      toast({
        title: "Erreur",
        description: `Impossible de créer la commande: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectClient = (clientId: string) => {
    // Trouver le client sélectionné
    const selectedClient = existingClients.find((client) => client.id === clientId);
    
    if (selectedClient) {
      form.setValue("clientId", selectedClient.id);
      form.setValue("clientName", selectedClient.name);
      form.setValue("clientPhone", selectedClient.phone || "");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-4">
        <Tabs defaultValue="existing" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="existing">
              <Users className="h-4 w-4 mr-2" />
              Client existant
            </TabsTrigger>
            <TabsTrigger value="new">
              <UserPlus className="h-4 w-4 mr-2" />
              Nouveau client
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing" className="space-y-4 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher un client..."
                className="pl-10"
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
              />
            </div>
            
            {isLoadingClients ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredClients.length > 0 ? (
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-3 border-b cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                    onClick={() => handleSelectClient(client.id)}
                  >
                    <div>
                      <p className="font-medium">{client.name}</p>
                      {client.phone && (
                        <p className="text-sm text-gray-500">{client.phone}</p>
                      )}
                    </div>
                    {client.loyalty_number && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {client.loyalty_number}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 p-4">Aucun client trouvé</p>
            )}
            
            <div className="flex flex-col space-y-2">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem hidden>
                    <FormControl>
                      <Input {...field} type="hidden" />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client sélectionné</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly placeholder="Aucun client sélectionné" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="new" className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du client</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Entrez le nom du client" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="clientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de téléphone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Entrez le numéro de téléphone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
        
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium mb-4">Détails de la commande</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut de paiement</FormLabel>
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
                      <SelectItem value="preparing">En préparation</SelectItem>
                      <SelectItem value="ready">Prête</SelectItem>
                      <SelectItem value="delivered">Livrée</SelectItem>
                      <SelectItem value="completed">Complétée</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant total (FCFA)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      placeholder="0" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="table"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Numéro de table</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Numéro de table" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="items"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Articles commandés</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Détails des articles commandés" 
                    rows={4} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes supplémentaires</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Notes supplémentaires sur la commande" 
                    rows={3} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="bg-restaurant-purple hover:bg-restaurant-purple/80"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Créer la commande"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
