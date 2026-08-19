import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KitchenHeader } from "@/components/kitchen/KitchenHeader";
import { KitchenOrderList } from "@/components/kitchen/KitchenOrderList";
import { useOrderStream } from "@/hooks/use-order-stream";

/**
 * The kitchen screen.
 *
 * Live updates come from a single server-sent event stream. The previous
 * version opened a Supabase realtime channel *and* ran a 30-second polling
 * loop as a fallback, in two different components.
 */
export default function KitchenInterface() {
  const { isConnected } = useOrderStream();

  return (
    <div className="min-h-screen bg-gray-50">
      <KitchenHeader isConnected={isConnected} />

      <main className="container mx-auto py-6 px-4">
        <Link to="/interface-admin" className="inline-block mb-4">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back-office
          </Button>
        </Link>

        <Tabs defaultValue="new">
          <TabsList>
            <TabsTrigger value="new">À préparer</TabsTrigger>
            <TabsTrigger value="preparing">En cours</TabsTrigger>
            <TabsTrigger value="ready">Prêtes</TabsTrigger>
            <TabsTrigger value="delivered">Livrées</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="new">
              <KitchenOrderList
                status="new"
                nextStatus="preparing"
                nextLabel="Commencer la préparation"
              />
            </TabsContent>
            <TabsContent value="preparing">
              <KitchenOrderList status="preparing" nextStatus="ready" nextLabel="Marquer prête" />
            </TabsContent>
            <TabsContent value="ready">
              <KitchenOrderList
                status="ready"
                nextStatus="delivered"
                nextLabel="Marquer livrée"
              />
            </TabsContent>
            <TabsContent value="delivered">
              <KitchenOrderList status="delivered" />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
