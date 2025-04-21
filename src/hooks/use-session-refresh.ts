
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseSessionRefreshOptions {
  onSessionChange: (session: any) => void;
}

export function useSessionRefresh({ onSessionChange }: UseSessionRefreshOptions) {
  useEffect(() => {
    // 1. Set up auth state listener (toujours synchrone)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // >> NE PAS FAIRE de logique async ici ! <<
      // On relaie la session reçue
      onSessionChange(session);
    });

    // 2. Initialiser en demandant le refresh immédiat de la session (après reload/mount)
    const initializeSession = async () => {
      // Rafraîchissement automatique des tokens si expirés
      await supabase.auth.getSession().then(({ data: { session } }) => {
        onSessionChange(session);
      });
    };
    initializeSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [onSessionChange]);
}
