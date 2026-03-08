import { type RefObject, useCallback, useEffect, useRef } from "react";

import { getGetMessagesQueryKey, getGetUsersListQueryKey, markRead } from "@/api/endpoints/message";
import { queryClient } from "@/lib/queryClient";
import { useChatStore } from "@/stores/useChatStore";

interface UseMarkReadReturn {
  observerRef: RefObject<IntersectionObserver | null>;
}

export function useMarkRead(
  selectedUserId: string | undefined,
): UseMarkReadReturn {
  const { markMessagesReadByIds } = useChatStore();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingReadRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushMarkRead = useCallback(() => {
    const ids = [...pendingReadRef.current];
    if (ids.length === 0) return;
    pendingReadRef.current.clear();
    markRead({ messageIds: ids }).then(() => {
      queryClient.invalidateQueries({ queryKey: getGetUsersListQueryKey() });
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey(selectedUserId) });
      }
    });
    markMessagesReadByIds(ids);
  }, [markMessagesReadByIds, selectedUserId]);

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
  }, [selectedUserId, flushMarkRead]);

  return { observerRef };
}
