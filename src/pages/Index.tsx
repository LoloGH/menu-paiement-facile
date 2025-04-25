
import React from 'react';
import { UserHeader } from "@/components/user-header/UserHeader";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-restaurant-purple mb-4">
            Bienvenue sur Menu Paiement Facile
          </h1>
          <p className="text-gray-600 mb-8">
            Votre plateforme de gestion de commandes de repas
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
