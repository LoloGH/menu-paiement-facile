
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin, isLoading } = useAdminAuth();
  const { toast } = useToast();

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for auth to be checked
      if (isLoading) return;

      // If user is logged in but not admin
      if (isLoggedIn && !isAdmin) {
        toast({
          title: "Accès refusé",
          description: "Votre compte n'a pas les droits administrateur nécessaires.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // If user is admin or not logged in yet (will be checked in AdminInterface)
      navigate("/interface-admin");
    };

    checkAccess();
  }, [isLoggedIn, isAdmin, isLoading, navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-4 border-t-4 border-t-restaurant-red border-restaurant-purple rounded-full animate-spin"></div>
    </div>
  );
};

export default Admin;
