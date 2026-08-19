import { useEffect, useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { toDateOnly } from "@menu/shared";
import { MenuCard } from "@/components/MenuCard";
import { WeekNavigation } from "@/components/WeekNavigation";
import { SocialMediaButtons } from "@/components/SocialMediaButtons";
import { UserHeader } from "@/components/user-header/UserHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCurrentMenus } from "@/hooks/api/use-menus";
import { toDayMenus } from "@/data/menuData";
import { WeeklyOrderButton } from "@/components/WeeklyOrderButton";

export default function Index() {
  const { data, isLoading, isError, error } = useCurrentMenus();
  const menus = useMemo(() => toDayMenus(data ?? []), [data]);
  const [activeDay, setActiveDay] = useState("");

  // Open on today's menu when there is one, otherwise on the first of the week.
  useEffect(() => {
    if (menus.length === 0) {
      setActiveDay("");
      return;
    }
    setActiveDay((current) => {
      if (current && menus.some((menu) => menu.id === current)) return current;
      const today = toDateOnly(new Date());
      return (menus.find((menu) => menu.serviceDate === today) ?? menus[0])?.id ?? "";
    });
  }, [menus]);

  return (
    <div className="min-h-screen bg-restaurant-cream bg-opacity-30 flex flex-col">
      <header className="bg-restaurant-purple text-white py-6 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-6">
            <div className="bg-white p-2 rounded-lg">
              <img
                src="/lovable-uploads/5936ebd2-a679-4024-b0c9-40785b7dcf47.png"
                alt="AXESS"
                className="h-16 md:h-20"
              />
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <UserHeader />
              <SocialMediaButtons />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Menu de la Semaine</h1>
            <p className="text-xl max-w-2xl mx-auto">
              Découvrez nos repas préparés par nos chefs pour chaque jour de la semaine.
              Commandez à l'avance et profitez de plats frais et savoureux.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-12 px-4 flex-1">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-restaurant-red text-white text-lg font-semibold px-6 py-3 rounded-full mb-6">
            <CalendarCheck className="h-5 w-5" />
            Commandez toute la semaine en une fois
          </div>
          {/* The weekly order goes through the same route as any other, so it
              is actually recorded — the previous button redirected straight to
              the payment link and never created an order at all. */}
          <WeeklyOrderButton menus={menus} />
        </div>

        {isLoading && (
          <div className="flex flex-col items-center py-12 gap-4">
            <div
              className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-restaurant-purple"
              role="status"
              aria-label="Chargement"
            />
            <p className="text-lg text-restaurant-purple">Chargement des menus…</p>
          </div>
        )}

        {isError && (
          <Alert variant="destructive" className="max-w-xl mx-auto">
            <AlertTitle>Menus indisponibles</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Le serveur n'a pas répondu."}
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !isError && menus.length === 0 && (
          <p className="text-center text-xl text-gray-600 py-12">
            Aucun menu n'est publié pour cette semaine. Revenez bientôt.
          </p>
        )}

        {!isLoading && menus.length > 0 && (
          <>
            <WeekNavigation menus={menus} activeDay={activeDay} setActiveDay={setActiveDay} />
            <div className="animate-fade-in mt-8">
              {menus.map((menu) => (
                <MenuCard key={menu.id} menu={menu} isActive={activeDay === menu.id} />
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="bg-restaurant-purple text-white py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg">
                <img
                  src="/lovable-uploads/5936ebd2-a679-4024-b0c9-40785b7dcf47.png"
                  alt="AXESS"
                  className="h-12"
                />
              </div>
              <p className="text-sm">© {new Date().getFullYear()} Menu Paiement Facile</p>
            </div>
            <SocialMediaButtons />
          </div>
          <p className="text-center text-sm mt-4">
            Tous nos plats sont préparés avec des ingrédients frais et de qualité.
          </p>
        </div>
      </footer>
    </div>
  );
}
