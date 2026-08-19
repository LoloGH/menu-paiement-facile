import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reason?: string;
}

/**
 * Sign in or create a customer account.
 *
 * The previous admin dialog offered a "create account" mode that granted the
 * admin role to any address containing the word "admin". Registration here
 * creates a plain customer account and nothing else — the server ignores any
 * role the client might try to ask for.
 */
export function LoginDialog({ isOpen, onClose, onSuccess, reason }: LoginDialogProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setError(null);
    setFieldErrors({});
    setPassword("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      if (mode === "register") {
        await register({ email, password, name, ...(phone ? { phone } : {}) });
      } else {
        await login(email, password);
      }
      reset();
      onSuccess();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors(
          Object.fromEntries(caught.fields.map((field) => [field.path, field.message])),
        );
      } else {
        setError("Connexion au serveur impossible.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "login" ? "Connexion" : "Créer un compte"}</DialogTitle>
        </DialogHeader>

        {reason && <p className="text-sm text-gray-600">{reason}</p>}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="login-name">Nom</Label>
              <Input
                id="login-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoComplete="name"
              />
              {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="login-email">Adresse e-mail</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
            {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">Mot de passe</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            {fieldErrors.password && (
              <p className="text-sm text-destructive">{fieldErrors.password}</p>
            )}
            {mode === "register" && !fieldErrors.password && (
              <p className="text-sm text-gray-500">12 caractères minimum.</p>
            )}
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="login-phone">Téléphone (facultatif)</Label>
              <Input
                id="login-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
              />
              {fieldErrors.phone && <p className="text-sm text-destructive">{fieldErrors.phone}</p>}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Patientez…" : mode === "login" ? "Se connecter" : "Créer le compte"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                reset();
              }}
            >
              {mode === "login" ? "Créer un compte" : "J'ai déjà un compte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
