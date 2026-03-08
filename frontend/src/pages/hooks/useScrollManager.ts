import type { ScrollToOptions } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/stores/useAuthStore";
import type { ChatMessage } from "@/stores/useChatStore";
import { useChatStore } from "@/stores/useChatStore";

interface UseScrollManagerParams {
  messages: ChatMessage[] | undefined;
  selectedUserId: string | undefined;
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
}

export function useScrollManager({
  messages,
  selectedUserId,
  scrollToIndex,
}: UseScrollManagerParams) {
  const { addIncomingUnread, clearIncomingUnread, setFirstUnreadIndex } =
    useChatStore();
  const { authUser } = useAuthStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const initDoneRef = useRef(false);
  const isAtBottomRef = useRef(true);

  const [sentinelEl, setSentinelEl] = useState<HTMLDivElement | null>(null);
  const bottomSentinelRef = useCallback((el: HTMLDivElement | null) => {
    setSentinelEl(el);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!sentinelEl || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isAtBottomRef.current = entry.isIntersecting;
        if (entry.isIntersecting) clearIncomingUnread();
      },
      { root: container, threshold: 0 },
    );
    observer.observe(sentinelEl);
    return () => observer.disconnect();
  }, [sentinelEl, clearIncomingUnread]);

  // Reset on conversation switch
  useEffect(() => {
    initDoneRef.current = false;
    isAtBottomRef.current = true;
    prevCountRef.current = 0;
    clearIncomingUnread();
  }, [selectedUserId, clearIncomingUnread]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !messages?.length) return;

    // Initial load
    if (!initDoneRef.current) {
      initDoneRef.current = true;
      prevCountRef.current = messages.length;

      const firstUnread = messages.findIndex(
        (m) =>
          m.senderId !== authUser?._id && !m.isRead && !m.pending && !m.failed,
      );

      if (firstUnread >= 0) {
        isAtBottomRef.current = false;
        setFirstUnreadIndex(firstUnread);
        scrollToIndex(firstUnread, { align: "start" });
      } else {
        scrollToIndex(messages.length - 1, { align: "end" });
      }
      return;
    }

    // New messages arrived
    if (messages.length > prevCountRef.current) {
      let hasOwnNewMessage = false;
      for (let i = prevCountRef.current; i < messages.length; i++) {
        const msg = messages[i];
        if (msg.senderId === authUser?._id || msg.pending) {
          hasOwnNewMessage = true;
        } else if (!msg.failed && !isAtBottomRef.current) {
          addIncomingUnread(i);
        }
      }
      prevCountRef.current = messages.length;

      if (hasOwnNewMessage || isAtBottomRef.current) {
        scrollToIndex(messages.length - 1, { align: "end" });
      }
    }
  }, [
    messages,
    authUser?._id,
    selectedUserId,
    scrollToIndex,
    setFirstUnreadIndex,
    addIncomingUnread,
  ]);

  return { scrollContainerRef, bottomSentinelRef };
}
