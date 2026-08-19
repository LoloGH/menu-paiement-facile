import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuditLog } from "@/hooks/api/use-admin";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function AuditLogViewer() {
  const [page, setPage] = useState(1);
  const { data: entries, isLoading, isError, error } = useAuditLog(page);

  return (
    <div className="space-y-4">
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
              <TableHead>Date</TableHead>
              <TableHead>Auteur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Ressource</TableHead>
              <TableHead>Détails</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Chargement…
                </TableCell>
              </TableRow>
            )}
            {entries?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Aucune entrée.
                </TableCell>
              </TableRow>
            )}
            {entries?.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDateTime(entry.createdAt)}
                </TableCell>
                <TableCell className="text-sm">{entry.actorEmail ?? "système"}</TableCell>
                <TableCell className="font-mono text-sm">{entry.action}</TableCell>
                <TableCell className="text-sm">{entry.resource}</TableCell>
                <TableCell className="text-xs text-gray-600 max-w-xs truncate">
                  {entry.details ? JSON.stringify(entry.details) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2 text-sm">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
        >
          Précédent
        </Button>
        <span>Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={(entries?.length ?? 0) < 50}
          onClick={() => setPage((current) => current + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
