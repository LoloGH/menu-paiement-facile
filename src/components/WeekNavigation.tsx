
import React from 'react';
import { Button } from "@/components/ui/button";
import { DayMenu } from '@/data/menuData';
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekNavigationProps {
  menus: DayMenu[];
  activeDay: string;
  setActiveDay: (day: string) => void;
}

export const WeekNavigation: React.FC<WeekNavigationProps> = ({ 
  menus, 
  activeDay, 
  setActiveDay 
}) => {
  const activeIndex = menus.findIndex(menu => menu.id === activeDay);
  
  const handlePrevious = () => {
    const newIndex = (activeIndex - 1 + menus.length) % menus.length;
    setActiveDay(menus[newIndex].id);
  };

  const handleNext = () => {
    const newIndex = (activeIndex + 1) % menus.length;
    setActiveDay(menus[newIndex].id);
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <Button
        variant="outline"
        onClick={handlePrevious}
        className="flex items-center text-restaurant-olive hover:text-restaurant-terracotta"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Jour précédent
      </Button>
      <div className="hidden md:flex items-center justify-center space-x-2">
        {menus.map((menu) => (
          <Button
            key={menu.id}
            variant={activeDay === menu.id ? "default" : "outline"}
            onClick={() => setActiveDay(menu.id)}
            className={`transition-all ${
              activeDay === menu.id 
                ? "bg-restaurant-olive text-white" 
                : "text-restaurant-olive hover:text-restaurant-terracotta"
            }`}
          >
            {menu.day.substring(0, 3)}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        onClick={handleNext}
        className="flex items-center text-restaurant-olive hover:text-restaurant-terracotta"
      >
        Jour suivant
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};
