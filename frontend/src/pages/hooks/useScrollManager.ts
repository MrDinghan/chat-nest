import type { ScrollToOptions } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import type { ConversationMessage } from "@/types/conversation";

interface UseScrollManagerParams {
  messages: ConversationMessage[] | undefined;
  selectedUserId: string | undefined;
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
}

export function useScrollManager({
  messages,
  selectedUserId,
  scrollToIndex,
}: UseScrollManagerParams) {
  const {
    addIncomingUnread,
    clearIncomingUnread,
    setFirstUnreadIndex,
    pendingScrollToMessageId,
    setPendingScrollToMessageId,
    setHighlightedMessageId,
  } = useChatStore();
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

      const isUnread = (m: ConversationMessage) =>
        m.readBy !== undefined
          ? !m.readBy.includes(authUser!._id)
          : m.isRead === false;

      const firstUnread = messages.findIndex(
        (m) =>
          m.senderId !== authUser?._id &&
          isUnread(m) &&
          !m.pending &&
          !m.failed,
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

  useEffect(() => {
    if (!pendingScrollToMessageId || !messages?.length) return;

    const idx = messages.findIndex((m) => m._id === pendingScrollToMessageId);
    if (idx === -1) return;

    scrollToIndex(idx, { align: "center" });
    setHighlightedMessageId(pendingScrollToMessageId);
    setPendingScrollToMessageId(null);
  }, [
    pendingScrollToMessageId,
    messages,
    scrollToIndex,
    setHighlightedMessageId,
    setPendingScrollToMessageId,
  ]);

  const { highlightedMessageId } = useChatStore();
  useEffect(() => {
    if (!highlightedMessageId) return;
    const timer = setTimeout(() => setHighlightedMessageId(null), 1500);
    return () => clearTimeout(timer);
  }, [highlightedMessageId, setHighlightedMessageId]);

  return { scrollContainerRef, bottomSentinelRef };
}
