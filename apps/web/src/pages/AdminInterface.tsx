import { Link } from "react-router-dom";
import { ChevronLeft, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserHeader } from "@/components/user-header/UserHeader";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { UserTable } from "@/components/admin/UserTable";
import { ArticlesManager } from "@/components/admin/articles/ArticlesManager";
import { MenuEditor } from "@/components/admin/menu-editor/MenuEditor";
import { AdminRoleManager } from "@/components/admin/AdminRoleManager";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { DashboardStats } from "@/components/admin/stats/DashboardStats";
import { usePermissions } from "@/hooks/use-permissions";

/**
 * The back office.
 *
 * Which tabs appear follows the caller's roles, but that is presentation only:
 * every route behind these panels is authorised again on the server, so a
 * forced tab shows an error rather than data.
 */
export default function AdminInterface() {
  const permissions = usePermissions();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-restaurant-purple text-white py-4 px-4">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="outline" size="sm" className="text-gray-900">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Site
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Back-office</h1>
          </div>
          <div className="flex items-center gap-3">
            {permissions.canViewKitchen && (
              <Link to="/cuisine">
                <Button variant="outline" size="sm" className="text-gray-900">
                  <UtensilsCrossed className="h-4 w-4 mr-1" />
                  Cuisine
                </Button>
              </Link>
            )}
            <UserHeader />
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <Tabs defaultValue={permissions.canViewDashboard ? "dashboard" : "orders"}>
          <TabsList className="flex flex-wrap h-auto">
            {permissions.canViewDashboard && (
              <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            )}
            {permissions.canViewOrders && <TabsTrigger value="orders">Commandes</TabsTrigger>}
            {permissions.canViewCatalogue && <TabsTrigger value="articles">Articles</TabsTrigger>}
            {permissions.canViewCatalogue && <TabsTrigger value="menus">Menus</TabsTrigger>}
            {permissions.canViewUsers && <TabsTrigger value="users">Utilisateurs</TabsTrigger>}
            {permissions.canManageRoles && <TabsTrigger value="roles">Rôles</TabsTrigger>}
            {permissions.canViewAudit && <TabsTrigger value="audit">Journal</TabsTrigger>}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="dashboard">
              {permissions.canViewDashboard ? <DashboardStats /> : <AccessDenied />}
            </TabsContent>
            <TabsContent value="orders">
              {permissions.canViewOrders ? <OrdersTable /> : <AccessDenied />}
            </TabsContent>
            <TabsContent value="articles">
              {permissions.canViewCatalogue ? (
                <ArticlesManager readOnly={!permissions.canManageCatalogue} />
              ) : (
                <AccessDenied />
              )}
            </TabsContent>
            <TabsContent value="menus">
              {permissions.canViewCatalogue ? (
                <MenuEditor readOnly={!permissions.canManageCatalogue} />
              ) : (
                <AccessDenied />
              )}
            </TabsContent>
            <TabsContent value="users">
              {permissions.canViewUsers ? <UserTable /> : <AccessDenied />}
            </TabsContent>
            <TabsContent value="roles">
              {permissions.canManageRoles ? <AdminRoleManager /> : <AccessDenied />}
            </TabsContent>
            <TabsContent value="audit">
              {permissions.canViewAudit ? <AuditLogViewer /> : <AccessDenied />}
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
