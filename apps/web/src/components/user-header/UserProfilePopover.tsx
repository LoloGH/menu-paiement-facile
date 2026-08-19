
import type { CurrentUser } from '@/contexts/auth-context';
import { Settings, ShoppingBag, LogOut } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserProfilePopoverProps {
  user: CurrentUser;
  onLogout: () => Promise<void>;
}

export function UserProfilePopover({ user, onLogout }: UserProfilePopoverProps) {
  const displayName = user.name || "Utilisateur";
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="bg-restaurant-purple text-white hover:bg-restaurant-purple/80">
          <User className="h-4 w-4 mr-2" />
          <span className="font-medium">{displayName}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-4">
        <div className="space-y-4">
          <h3 className="font-medium text-center mb-2 text-restaurant-purple">Espace Client</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p className="flex items-center">
              <span className="font-semibold mr-2">Nom:</span> {displayName}
            </p>
            <p className="flex items-center">
              <span className="font-semibold mr-2">Email:</span> {user.email}
            </p>
            {user.phone && (
              <p className="flex items-center">
                <span className="font-semibold mr-2">Téléphone:</span> {user.phone}
              </p>
            )}
            {user.roles.length > 0 && (
              <p className="flex items-center">
                <span className="font-semibold mr-2">Rôles:</span> {user.roles.join(", ")}
              </p>
            )}
          </div>
          <div className="pt-2 border-t space-y-2">
            <Link to="/profil" className="block w-full">
              <Button 
                variant="outline" 
                className="w-full text-gray-700 hover:bg-gray-100"
              >
                <Settings className="h-4 w-4 mr-2" />
                Gérer mon profil
              </Button>
            </Link>
            <Link to="/mes-commandes" className="block w-full">
              <Button 
                variant="outline" 
                className="w-full text-gray-700 hover:bg-gray-100"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Mes commandes
              </Button>
            </Link>
            {user.roles.length > 0 && (
              <Link to="/interface-admin" className="block w-full">
                <Button variant="outline" className="w-full text-gray-700 hover:bg-gray-100">
                  <Settings className="h-4 w-4 mr-2" />
                  Back-office
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
              className="w-full text-white bg-restaurant-red hover:bg-restaurant-red/80"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
