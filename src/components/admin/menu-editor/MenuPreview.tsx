
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Utensils, Coffee, IceCream } from "lucide-react";
import { MenuDay } from "./types";

interface MenuPreviewProps {
  menu: MenuDay;
}

export const MenuPreview = ({ menu }: MenuPreviewProps) => {
  return (
    <Card className="border-2 border-blue-200 mb-4">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Aperçu: {menu.day}
          {menu.date && <span className="ml-2 text-sm text-gray-500">({menu.date})</span>}
        </CardTitle>
        <CardDescription>
          Voici à quoi ressemblera ce menu sur la page d'accueil
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 bg-white">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Utensils className="h-5 w-5 mr-2 text-restaurant-purple" />
              Plats principaux
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menu.mainDishes.map((dish) => (
                <Card key={dish.id} className="overflow-hidden">
                  <CardHeader className="p-3 bg-restaurant-olive text-white">
                    <CardTitle className="text-base">{dish.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-gray-600">{dish.description}</p>
                      <Badge className="bg-restaurant-purple ml-2">
                        {dish.price} FCFA
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Coffee className="h-5 w-5 mr-2 text-restaurant-terracotta" />
              Accompagnements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {menu.sideDishes.map((dish) => (
                <Card key={dish.id} className="overflow-hidden">
                  <CardHeader className="p-2 bg-restaurant-terracotta text-white">
                    <CardTitle className="text-sm">{dish.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-600 truncate">
                        {dish.description}
                      </p>
                      <Badge className="bg-restaurant-terracotta ml-2 text-xs">
                        {dish.price} FCFA
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <IceCream className="h-5 w-5 mr-2 text-restaurant-red" />
              Desserts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {menu.desserts.map((dish) => (
                <Card key={dish.id} className="overflow-hidden">
                  <CardHeader className="p-2 bg-restaurant-red text-white">
                    <CardTitle className="text-sm">{dish.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-600 truncate">
                        {dish.description}
                      </p>
                      <Badge className="bg-restaurant-red ml-2 text-xs">
                        {dish.price} FCFA
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
