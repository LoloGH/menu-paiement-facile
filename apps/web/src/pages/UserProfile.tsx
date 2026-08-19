import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { api, ApiError } from "@/lib/api";

export default function UserProfile() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: (payload: { name?: string; phone?: string }) => api.patch("/api/me", payload),
    onSuccess: async () => {
      await refresh();
      toast({ title: "Profil mis à jour" });
    },
  });

  const changePassword = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      api.post("/api/me/password", payload),
    onSuccess: () => {
      // The server revokes every session on a password change, so the cache is
      // no longer backed by a valid session.
      queryClient.clear();
      toast({
        title: "Mot de passe modifié",
        description: "Toutes vos sessions ont été fermées. Reconnectez-vous.",
      });
      window.location.href = "/";
    },
  });

  const handleProfileSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    updateProfile.mutate(
      { name, ...(phone ? { phone } : {}) },
      {
        onError: (caught) =>
          setError(caught instanceof ApiError ? caught.message : "Mise à jour impossible."),
      },
    );
  };

  const handlePasswordSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onError: (caught) =>
          setError(caught instanceof ApiError ? caught.message : "Changement impossible."),
      },
    );
  };

  return (
    <div className="min-h-screen bg-restaurant-cream bg-opacity-30 py-8 px-4">
      <div className="container mx-auto max-w-2xl space-y-6">
        <Link to="/">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour au menu
          </Button>
        </Link>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Mon profil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-email">Adresse e-mail</Label>
                {/* Changing the address would change the login identity; that
                    needs a verification flow, so it is read-only for now. */}
                <Input id="profile-email" value={user?.email ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nom</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Téléphone</Label>
                <Input
                  id="profile-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mot de passe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                />
                <p className="text-sm text-gray-500">12 caractères minimum.</p>
              </div>
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? "Modification…" : "Changer le mot de passe"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
