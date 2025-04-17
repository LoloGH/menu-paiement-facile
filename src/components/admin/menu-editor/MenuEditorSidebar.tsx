
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Calendar } from "lucide-react";
import { MenuDay } from './types';
import { cn } from "@/lib/utils";

interface MenuEditorSidebarProps {
  menus: MenuDay[];
  activeMenuId: string;
  onSelectMenu: (menuId: string) => void;
}

export const MenuEditorSidebar: React.FC<MenuEditorSidebarProps> = ({
  menus,
  activeMenuId,
  onSelectMenu,
}) => {
  return (
    <Sidebar className="border-r bg-gray-50/50">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Jours de la semaine</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menus.map((menu) => (
                <SidebarMenuItem key={menu.id}>
                  <SidebarMenuButton
                    onClick={() => onSelectMenu(menu.id)}
                    className={cn(
                      "w-full justify-start gap-2",
                      activeMenuId === menu.id && "bg-restaurant-purple/10 text-restaurant-purple"
                    )}
                  >
                    <Calendar className="h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span>{menu.day}</span>
                      {menu.date && (
                        <span className="text-xs text-muted-foreground">
                          {menu.date}
                        </span>
                      )}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
