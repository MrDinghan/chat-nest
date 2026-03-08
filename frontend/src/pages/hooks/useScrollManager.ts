import type { ScrollToOptions } from "@tanstack/react-virtual";
import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

import { useAuthStore } from "@/stores/useAuthStore";
import type { ChatMessage } from "@/stores/useChatStore";
import { useChatStore } from "@/stores/useChatStore";

interface UseScrollManagerParams {
  messages: ChatMessage[] | undefined;
  totalVirtualSize: number;
  selectedUserId: string | undefined;
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
}

interface UseScrollManagerReturn {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  handleScroll: () => void;
  isAtBottomRef: RefObject<boolean>;
}

export function useScrollManager({
  messages,
  totalVirtualSize,
  selectedUserId,
  scrollToIndex,
}: UseScrollManagerParams): UseScrollManagerReturn {
  const { addIncomingUnread, clearIncomingUnread, setFirstUnreadIndex } = useChatStore();
  const { authUser } = useAuthStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(false);
  const isAtBottomRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);

  // Reset on conversation switch
  useEffect(() => {
    isInitialLoad.current = true;
    isAtBottomRef.current = true;
    prevMessagesLengthRef.current = 0;
    clearIncomingUnread();
  }, [clearIncomingUnread, selectedUserId]);

  // Track new incoming messages
  useEffect(() => {
    if (!messages || messages.length === 0) {
      prevMessagesLengthRef.current = 0;
      return;
    }
    const prev = prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;
    if (prev === 0) return;
    for (let i = prev; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.senderId !== authUser?._id && !msg.pending && !msg.failed) {
        if (!isAtBottomRef.current) {
          addIncomingUnread(i);
        }
      }
    }
  }, [addIncomingUnread, authUser?._id, messages]);

  // Auto-scroll on initial load (to first unread, or bottom) or when already at bottom
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !messages?.length) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      const firstUnread = messages.findIndex(
        (m) =>
          m.senderId !== authUser?._id && !m.isRead && !m.pending && !m.failed,
      );
      if (firstUnread >= 0) {
        isAtBottomRef.current = false;
        setFirstUnreadIndex(firstUnread);
        scrollToIndex(firstUnread, { align: "start" as const });
      } else {
        el.scrollTop = el.scrollHeight;
      }
    } else if (isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, totalVirtualSize, authUser?._id, scrollToIndex, setFirstUnreadIndex]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (isAtBottomRef.current) clearIncomingUnread();
  }, [clearIncomingUnread]);

  return { scrollContainerRef, handleScroll, isAtBottomRef };
}
