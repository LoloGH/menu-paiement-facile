
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        <h1 className="text-6xl font-bold text-restaurant-purple mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-6">Oops! Page introuvable</p>
        <p className="text-gray-600 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col gap-4">
          <Link to="/">
            <Button className="w-full bg-restaurant-purple hover:bg-restaurant-purple/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
          <Link to="/profil">
            <Button variant="outline" className="w-full">
              Accéder à votre profil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
