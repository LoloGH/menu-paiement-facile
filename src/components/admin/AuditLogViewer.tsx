import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { History, User, Calendar, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Pagination, PaginationContent, PaginationItem, 
  PaginationLink, PaginationNext, PaginationPrevious 
} from "@/components/ui/pagination";
import { AdminAuditLog } from "@/types/admin-audit";

type AuditLog = AdminAuditLog;

export const AuditLogViewer = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const { toast } = useToast();

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      // Get total count using the "unsafe" approach to work around TypeScript limitations
      const countResult = await (supabase as any)
        .from('admin_audit_log')
        .select('*', { count: 'exact' });
      
      if (countResult.error) throw countResult.error;
      setTotalItems(countResult.count || 0);
      
      // Get paginated logs
      const { data, error } = await (supabase as any)
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);
      
      if (error) throw error;
      
      // Fetch user emails separately
      const userIds = [...new Set(data.map((log: AuditLog) => log.user_id))];
      const userEmails: Record<string, string> = {};
      
      // Only fetch emails if there are logs
      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds as string[]);
        
        if (!userError && userData) {
          userData.forEach((user) => {
            userEmails[user.id] = user.email;
          });
        }
      }
      
      // Format the data
      const formattedLogs = data.map((log: AuditLog) => ({
        ...log,
        user_email: userEmails[log.user_id] || log.user_id.substring(0, 8) + '...'
      }));
      
      setLogs(formattedLogs);
    } catch (error) {
      console.error("Error loading audit logs:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique d'audit.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadLogs();
  }, [page]);
  
  const formatAction = (action: string) => {
    switch (action) {
      case 'add_user_role':
        return 'Ajout de rôle';
      case 'remove_user_role':
        return 'Suppression de rôle';
      case 'update_order':
        return 'Modification de commande';
      case 'delete_order':
        return 'Suppression de commande';
      case 'update_menu':
        return 'Modification de menu';
      default:
        return action.replace(/_/g, ' ');
    }
  };
  
  const formatResource = (resource: string) => {
    switch (resource) {
      case 'user_roles':
        return 'Gestion des rôles';
      case 'orders':
        return 'Commandes';
      case 'menu_items':
        return 'Menus';
      default:
        return resource;
    }
  };
  
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-restaurant-purple" />
          Journal d'audit
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Chargement...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune action n'a été enregistrée
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                          {new Date(log.created_at).toLocaleString('fr-FR')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1 text-gray-500" />
                          {log.user_email}
                        </span>
                      </TableCell>
                      <TableCell>{formatAction(log.action)}</TableCell>
                      <TableCell>{formatResource(log.resource)}</TableCell>
                      <TableCell>
                        {log.details && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              try {
                                const details = JSON.parse(log.details || '{}');
                                toast({
                                  title: "Détails",
                                  description: (
                                    <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4 text-white">
                                      <code className="text-xs">
                                        {JSON.stringify(details, null, 2)}
                                      </code>
                                    </pre>
                                  ),
                                });
                              } catch (e) {
                                toast({
                                  title: "Détails",
                                  description: log.details,
                                });
                              }
                            }}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink 
                        onClick={() => setPage(i + 1)}
                        isActive={page === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
