import { Wifi, WifiOff } from "lucide-react";
import { UserHeader } from "@/components/user-header/UserHeader";

export function KitchenHeader({ isConnected }: { isConnected: boolean }) {
  return (
    <header className="bg-restaurant-purple text-white p-4 shadow-md">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-md">
            <img
              src="/lovable-uploads/5936ebd2-a679-4024-b0c9-40785b7dcf47.png"
              alt="AXESS"
              className="h-10"
            />
          </div>
          <h1 className="text-xl font-semibold">Cuisine</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Whether the live stream is up matters here: a disconnected screen
              silently stops showing new orders. */}
          <span
            className="flex items-center gap-1 text-sm"
            title={isConnected ? "Mises à jour en direct" : "Reconnexion en cours"}
          >
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4" aria-hidden />
                En direct
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" aria-hidden />
                Reconnexion…
              </>
            )}
          </span>
          <UserHeader />
        </div>
      </div>
    </header>
  );
}
