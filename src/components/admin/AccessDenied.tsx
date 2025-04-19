
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface AccessDeniedProps {
  message?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ 
  message = "Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité."
}) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-restaurant-red mb-4" />
        <h2 className="text-xl font-semibold mb-2">Accès refusé</h2>
        <p className="text-gray-600">{message}</p>
      </CardContent>
    </Card>
  );
};
