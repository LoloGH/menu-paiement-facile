
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Search, Plus, Users, RefreshCw } from "lucide-react";
import { supabase, createNewClient, fetchAllClients } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface NewOrderFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const NewOrderForm: React.FC<NewOrderFormProps> = ({ onSubmit, onCancel }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isNewClient, setIsNewClient] = useState(false);

  // Informations générales sur la commande
  const [receiptId, setReceiptId] = useState(() => `CMD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`);
  const [totalAmount, setTotalAmount] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [orderDetails, setOrderDetails] = useState("");
  
  // Informations sur le nouveau client
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // Informations sur le client invité
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  
  // Tableau des articles de la commande
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoadingClients(true);
    try {
      const clients = await fetchAllClients();
      if (clients) {
        setClients(clients);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des clients",
        variant: "destructive",
      });
    } finally {
      setIsLoadingClients(false);
    }
  };

  const filteredClients = clientSearch 
    ? clients.filter(client => 
        client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (client.phone && client.phone.includes(clientSearch)))
    : clients;

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du client est obligatoire",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const clientData = {
        name: newClientName.trim(),
        phone: newClientPhone.trim() || undefined
      };
      
      const newClient = await createNewClient(clientData);
      
      if (newClient) {
        toast({
          title: "Succès",
          description: "Client créé avec succès",
        });
        
        // Mettre à jour la liste des clients et sélectionner le nouveau client
        await loadClients();
        setSelectedClientId(newClient.id);
        setIsNewClient(false);
        
        // Réinitialiser les champs
        setNewClientName("");
        setNewClientPhone("");
        setIsClientDialogOpen(false);
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le client",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsClientDialogOpen(false);
  };

  const handleAddOrderItem = () => {
    const newItem = {
      id: uuidv4(),
      day: "Lundi", // Valeur par défaut
      main_dish: "Plat principal",
      side_dish: "Accompagnement",
      dessert: "Dessert",
      price: 0
    };
    
    setOrderItems(prev => [...prev, newItem]);
  };

  const handleRemoveOrderItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleUpdateOrderItem = (itemId: string, field: string, value: any) => {
    setOrderItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  };

  useEffect(() => {
    setTotalAmount(calculateTotal().toString());
  }, [orderItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (orderItems.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins un article à la commande",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Préparer les données de la commande - use explicit type to match database schema
      const orderData: {
        receipt_id: string;
        total_amount: number;
        payment_status: string;
        details: string | null;
        client_id?: string;
        guest_name?: string;
        guest_phone?: string;
      } = {
        receipt_id: receiptId,
        total_amount: parseFloat(totalAmount),
        payment_status: paymentStatus,
        details: orderDetails || null
      };
      
      // Ajouter les informations du client selon le mode choisi
      if (selectedClientId) {
        orderData.client_id = selectedClientId;
      } else {
        orderData.guest_name = guestName;
        orderData.guest_phone = guestPhone;
      }
      
      // Soumettre la commande principale
      const { data: order, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
        
      if (error) throw error;
      
      // Maintenant, ajouter les articles de la commande
      const orderItemsData = orderItems.map(item => ({
        order_id: order.id,
        day: item.day,
        main_dish: item.main_dish,
        side_dish: item.side_dish,
        dessert: item.dessert,
        price: parseFloat(item.price),
        meal_option_id: `order-${order.id}-item-${item.id}`
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);
        
      if (itemsError) throw itemsError;
      
      toast({
        title: "Succès",
        description: "Commande créée avec succès",
      });
      
      // Appeler la fonction onSubmit avec les données créées
      onSubmit(order);
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Erreur",
        description: `Impossible de créer la commande: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">ID de la commande</label>
            <Input
              value={receiptId}
              onChange={(e) => setReceiptId(e.target.value)}
              placeholder="CMD-0000"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Statut</label>
            <Select
              value={paymentStatus}
              onValueChange={setPaymentStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut de paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="preparing">En préparation</SelectItem>
                <SelectItem value="ready">Prêt</SelectItem>
                <SelectItem value="delivered">Livré</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border rounded-md p-4 bg-gray-50">
          <h3 className="font-semibold mb-3 flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Information client
          </h3>
          
          <Tabs defaultValue="existing" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Client Existant</TabsTrigger>
              <TabsTrigger value="guest">Client Invité</TabsTrigger>
            </TabsList>
            <TabsContent value="existing" className="py-2">
              <div className="mb-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => setIsClientDialogOpen(true)}
                >
                  <span>
                    {selectedClientId ? 
                      clients.find(c => c.id === selectedClientId)?.name || "Sélectionner un client" : 
                      "Sélectionner un client"}
                  </span>
                  <Users className="h-4 w-4 ml-2" />
                </Button>
              </div>
              
              {selectedClientId && (
                <div className="text-sm text-gray-500">
                  Client sélectionné: {clients.find(c => c.id === selectedClientId)?.name}
                  {clients.find(c => c.id === selectedClientId)?.loyalty_number && (
                    <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                      {clients.find(c => c.id === selectedClientId)?.loyalty_number}
                    </span>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="guest" className="py-2">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom de l'invité</label>
                  <Input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nom du client invité"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone (Optionnel)</label>
                  <Input
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Numéro de téléphone"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="border rounded-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Articles commandés</h3>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleAddOrderItem} 
              className="text-restaurant-purple"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un article
            </Button>
          </div>
          
          {orderItems.length === 0 ? (
            <div className="text-center py-4 text-gray-500 italic">
              Aucun article ajouté. Cliquez sur "Ajouter un article" pour commencer.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jour</TableHead>
                  <TableHead>Plat principal</TableHead>
                  <TableHead>Accompagnement</TableHead>
                  <TableHead>Dessert</TableHead>
                  <TableHead>Prix (FCFA)</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Select
                        value={item.day}
                        onValueChange={(value) => handleUpdateOrderItem(item.id, 'day', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Jour" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lundi">Lundi</SelectItem>
                          <SelectItem value="Mardi">Mardi</SelectItem>
                          <SelectItem value="Mercredi">Mercredi</SelectItem>
                          <SelectItem value="Jeudi">Jeudi</SelectItem>
                          <SelectItem value="Vendredi">Vendredi</SelectItem>
                          <SelectItem value="Samedi">Samedi</SelectItem>
                          <SelectItem value="Dimanche">Dimanche</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={item.main_dish}
                        onChange={(e) => handleUpdateOrderItem(item.id, 'main_dish', e.target.value)}
                        placeholder="Plat principal"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={item.side_dish}
                        onChange={(e) => handleUpdateOrderItem(item.id, 'side_dish', e.target.value)}
                        placeholder="Accompagnement"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={item.dessert}
                        onChange={(e) => handleUpdateOrderItem(item.id, 'dessert', e.target.value)}
                        placeholder="Dessert"
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        value={item.price}
                        onChange={(e) => handleUpdateOrderItem(item.id, 'price', e.target.value)}
                        placeholder="Prix"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveOrderItem(item.id)}
                      >
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          <div className="mt-4 text-right">
            <p className="font-semibold">
              Total: {parseInt(totalAmount).toLocaleString('fr-FR')} FCFA
            </p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Notes supplémentaires (optionnel)</label>
          <Textarea
            value={orderDetails}
            onChange={(e) => setOrderDetails(e.target.value)}
            placeholder="Détails supplémentaires sur la commande..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button 
          type="submit" 
          className="bg-restaurant-purple hover:bg-restaurant-purple/80"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            'Créer la commande'
          )}
        </Button>
      </div>

      {/* Dialogue pour sélectionner un client existant */}
      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sélectionner un client</DialogTitle>
            <DialogDescription>
              Choisissez parmi les clients existants ou créez-en un nouveau
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  className="pl-10"
                  placeholder="Rechercher un client par nom ou téléphone"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={loadClients}
                disabled={isLoadingClients}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingClients ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <Tabs defaultValue="list">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">Liste des clients</TabsTrigger>
                <TabsTrigger value="new">Nouveau client</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list" className="max-h-[300px] overflow-auto">
                {isLoadingClients ? (
                  <div className="py-8 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-restaurant-purple" />
                    <p className="mt-2">Chargement des clients...</p>
                  </div>
                ) : filteredClients.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Fidélité</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map(client => (
                        <TableRow key={client.id}>
                          <TableCell>{client.name}</TableCell>
                          <TableCell>{client.phone || '-'}</TableCell>
                          <TableCell>
                            {client.loyalty_number || '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSelectClient(client.id)}
                            >
                              Sélectionner
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">Aucun client trouvé</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="new">
                <div className="space-y-4 py-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom *</label>
                    <Input
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Nom du client"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Téléphone</label>
                    <Input
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="Numéro de téléphone"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleCreateClient}
                    className="w-full bg-restaurant-purple hover:bg-restaurant-purple/80"
                    disabled={isSubmitting || !newClientName.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer le client
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};
