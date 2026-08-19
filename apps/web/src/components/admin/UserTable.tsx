import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAdminUsers, useToggleUser } from "@/hooks/api/use-admin";
import { usePermissions } from "@/hooks/use-permissions";

export function UserTable() {
  const { toast } = useToast();
  const permissions = usePermissions();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isError, error } = useAdminUsers(debouncedSearch, page);
  const toggleUser = useToggleUser();

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / (data?.pageSize ?? 25)));

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Nom, e-mail, téléphone…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          aria-label="Rechercher un utilisateur"
        />
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : "Chargement impossible."}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Rôles</TableHead>
              <TableHead>État</TableHead>
              {permissions.canManageUsers && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Aucun compte ne correspond.
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name ?? "—"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length === 0 ? (
                      <span className="text-gray-500 text-sm">client</span>
                    ) : (
                      user.roles.map((role) => (
                        <Badge key={role} variant="outline">
                          {role}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.disabledAt ? (
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                      Désactivé
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Actif
                    </Badge>
                  )}
                </TableCell>
                {permissions.canManageUsers && (
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={toggleUser.isPending}
                      onClick={() =>
                        toggleUser.mutate(
                          { id: user.id, enable: user.disabledAt !== null },
                          {
                            onSuccess: () => toast({ title: "Compte mis à jour" }),
                            onError: (caught) =>
                              toast({
                                title: "Action impossible",
                                description: caught instanceof Error ? caught.message : undefined,
                                variant: "destructive",
                              }),
                          },
                        )
                      }
                    >
                      {user.disabledAt ? "Réactiver" : "Désactiver"}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {total} compte{total > 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Précédent
          </Button>
          <span>
            Page {page} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => setPage((current) => current + 1)}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
