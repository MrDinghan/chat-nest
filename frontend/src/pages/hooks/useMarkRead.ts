import { type RefObject, useCallback, useEffect, useRef } from "react";

import { markGroupMessagesRead } from "@/api/endpoints/group";
import { getGetMessagesQueryKey, getGetUsersListQueryKey, markRead } from "@/api/endpoints/message";
import { queryClient } from "@/lib/queryClient";
import { useChatStore } from "@/stores/useChatStore";

interface UseMarkReadReturn {
  observerRef: RefObject<IntersectionObserver | null>;
}

export function useMarkRead({
  userId,
  groupId,
}: {
  userId?: string;
  groupId?: string;
}): UseMarkReadReturn {
  const { markMessagesReadByIds } = useChatStore();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingReadRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushMarkRead = useCallback(() => {
    const ids = [...pendingReadRef.current];
    if (ids.length === 0) return;
    pendingReadRef.current.clear();

    if (groupId) {
      markGroupMessagesRead(groupId, { messageIds: ids });
    } else {
      markRead({ messageIds: ids }).then(() => {
        queryClient.invalidateQueries({ queryKey: getGetUsersListQueryKey() });
        if (userId) {
          queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey(userId) });
        }
      });
      markMessagesReadByIds(ids);
    }
  }, [markMessagesReadByIds, userId, groupId]);

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
  }, [userId, groupId, flushMarkRead]);

  return { observerRef };
}
