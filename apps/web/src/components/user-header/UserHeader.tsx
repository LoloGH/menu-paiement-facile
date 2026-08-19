import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { LoginDialog } from "@/components/LoginDialog";
import { UserProfilePopover } from "./UserProfilePopover";

export function UserHeader({ className }: { className?: string }) {
  const { isLoggedIn, user, logout } = useAuth();
  const { toast } = useToast();
  const [showLogin, setShowLogin] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast({ title: "Déconnexion", description: "Vous avez été déconnecté." });
  };

  return (
    <div className={className}>
      {isLoggedIn && user ? (
        <UserProfilePopover user={user} onLogout={handleLogout} />
      ) : (
        <Button
          variant="outline"
          className="bg-restaurant-red text-white hover:bg-restaurant-red/80"
          onClick={() => setShowLogin(true)}
        >
          <LogIn className="h-4 w-4 mr-2" />
          Connexion
        </Button>
      )}

      <LoginDialog
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={() => {
          setShowLogin(false);
          toast({ title: "Connexion réussie", description: "Vous êtes connecté." });
        }}
      />
    </div>
  );
}
