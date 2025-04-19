
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminAuditLog } from "@/types/admin-audit";
import { CalendarIcon, SearchIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export const AuditLogViewer = () => {
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, [date]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      // Use type assertion to bypass TypeScript checking
      let query = (supabase as any)
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false });

      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        query = query
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user emails for each log entry
      const logsWithUserData = await Promise.all(
        data.map(async (log: AdminAuditLog) => {
          try {
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("email")
              .eq("id", log.user_id)
              .single();

            return {
              ...log,
              // Only set user_email if userData exists and has email
              user_email: userData?.email || "Unknown user"
            };
          } catch (e) {
            return {
              ...log,
              user_email: "Unknown user"
            };
          }
        })
      );

      setAuditLogs(logsWithUserData as AdminAuditLog[]);
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les logs d'audit: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchAuditLogs();
  };

  const filteredLogs = searchTerm
    ? auditLogs.filter(
        (log) =>
          log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.details &&
            JSON.stringify(log.details)
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      )
    : auditLogs;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Journal d'audit</CardTitle>
        <CardDescription>
          Consultez toutes les actions effectuées par les administrateurs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="search" className="mb-2 block">
              Rechercher
            </Label>
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="search"
                placeholder="Rechercher par action, ressource, utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Filtrer par date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, "PPP", { locale: fr })
                  ) : (
                    <span>Choisir une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch}>Rechercher</Button>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-restaurant-purple"></div>
          </div>
        ) : (
          <div className="rounded-md border">
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
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", {
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell>{log.user_email}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.details ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Voir détails
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96">
                              <pre className="text-xs p-2 bg-gray-100 rounded overflow-auto max-h-60">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Aucun résultat trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
