import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api/queryKeys";
import { logger } from "@/lib/logger";
import { playSounds } from "@/utils/soundEffects";

/**
 * Subscribes to the server's order event stream.
 *
 * One EventSource replaces the Supabase realtime channel and the three
 * hand-rolled polling loops the old screens ran. The browser reconnects on its
 * own when the connection drops, so there is no retry logic to write here — the
 * only thing to track is whether it is currently up, because a kitchen screen
 * that has quietly stopped receiving orders looks exactly like a quiet service.
 */
export function useOrderStream({ playSound = true }: { playSound?: boolean } = {}) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const playSoundRef = useRef(playSound);
  playSoundRef.current = playSound;

  useEffect(() => {
    const source = new EventSource("/api/kitchen/stream", { withCredentials: true });

    source.onopen = () => setIsConnected(true);

    source.onerror = () => {
      // EventSource retries by itself; this only reflects the current state.
      setIsConnected(false);
    };

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string };
        logger.debug("order event", payload);

        if (payload.type === "order.created" && playSoundRef.current) {
          playSounds.newOrder();
        }
        void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      } catch (error) {
        logger.warn("évènement illisible", error);
      }
    };

    return () => {
      source.close();
      setIsConnected(false);
    };
  }, [queryClient]);

  return { isConnected };
}
