import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { USER_ROLES, type UserRole } from "@menu/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useGrantRole, useRevokeRole, useRoles } from "@/hooks/api/use-admin";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  order_manager: "Gestionnaire de commandes",
  kitchen: "Cuisine",
  viewer: "Lecture seule",
};

/**
 * Grants and revokes back-office roles.
 *
 * Every action here is checked again on the server, which also refuses to
 * remove the last administrator. This screen only makes the operation
 * convenient; it is not what makes it safe.
 */
export function AdminRoleManager() {
  const { toast } = useToast();
  const { data: assignments, isLoading, isError, error } = useRoles();
  const grantRole = useGrantRole();
  const revokeRole = useRevokeRole();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");

  const handleGrant = (event: FormEvent) => {
    event.preventDefault();
    grantRole.mutate(
      { email, role },
      {
        onSuccess: () => {
          setEmail("");
          toast({ title: "Rôle attribué", description: `${ROLE_LABELS[role]} → ${email}` });
        },
        onError: (caught) =>
          toast({
            title: "Attribution impossible",
            description: caught instanceof Error ? caught.message : undefined,
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleGrant} className="flex flex-wrap gap-3 items-end">
        <div className="space-y-2 flex-1 min-w-[240px]">
          <Label htmlFor="role-email">Adresse e-mail d'un compte existant</Label>
          <Input
            id="role-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="personne@exemple.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role-select">Rôle</Label>
          <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
            <SelectTrigger id="role-select" className="w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_ROLES.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {ROLE_LABELS[entry]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={grantRole.isPending}>
          {grantRole.isPending ? "Attribution…" : "Attribuer"}
        </Button>
      </form>

      <p className="text-sm text-gray-600">
        Le compte doit déjà exister : un rôle s'attribue à quelqu'un d'inscrit, il ne crée pas de
        compte.
      </p>

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
              <TableHead>Compte</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Attribué le</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {assignments?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  Aucun rôle attribué.
                </TableCell>
              </TableRow>
            )}
            {assignments?.map((assignment) => (
              <TableRow key={`${assignment.userId}-${assignment.role}`}>
                <TableCell>
                  {assignment.name ?? "—"}
                  <span className="block text-xs text-gray-500">{assignment.email}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{ROLE_LABELS[assignment.role]}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(assignment.createdAt).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={revokeRole.isPending}
                    aria-label={`Retirer le rôle ${ROLE_LABELS[assignment.role]}`}
                    onClick={() =>
                      revokeRole.mutate(
                        { userId: assignment.userId, role: assignment.role },
                        {
                          onSuccess: () => toast({ title: "Rôle retiré" }),
                          onError: (caught) =>
                            toast({
                              title: "Retrait impossible",
                              description: caught instanceof Error ? caught.message : undefined,
                              variant: "destructive",
                            }),
                        },
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-restaurant-red" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
