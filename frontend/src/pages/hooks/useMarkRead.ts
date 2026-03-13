import { type RefObject, useCallback, useEffect, useRef } from "react";

import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";

interface UseMarkReadReturn {
  observerRef: RefObject<IntersectionObserver | null>;
}

export const useMarkRead = ({
  conversationId,
}: {
  conversationId?: string;
}): UseMarkReadReturn => {
  const socket = useAuthStore((s) => s.socket);
  const { updateMessageReadBy } = useChatStore();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingReadRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushMarkRead = useCallback(() => {
    const ids = [...pendingReadRef.current];
    if (ids.length === 0 || !conversationId) return;
    pendingReadRef.current.clear();

    // Emit via socket
    socket?.emit("markRead", { messageIds: ids, conversationId });

    // Optimistically update local state
    const authUser = useAuthStore.getState().authUser;
    if (authUser) {
      updateMessageReadBy(ids, authUser._id);
    }
  }, [socket, conversationId, updateMessageReadBy]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.msgId;
            if (id) {
              pendingReadRef.current.add(id);
              observerRef.current?.unobserve(entry.target);
            }
          }
        });
        if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
        flushTimerRef.current = setTimeout(flushMarkRead, 300);
      },
      { threshold: 0.5 },
    );

    return () => {
      observerRef.current?.disconnect();
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushMarkRead();
    };
  }, [conversationId, flushMarkRead]);

  return { observerRef };
}
