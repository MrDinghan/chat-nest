import type { MessageDto } from "@shared/socket-events";
import { create } from "zustand";

import type {
  ConversationResponseDto,
  ReactionDto,
} from "@/api/endpoints/chatNestAPI.schemas";
import { getGetConversationListQueryKey } from "@/api/endpoints/conversation";
import { queryClient } from "@/lib/queryClient";

export type ConversationMessage = MessageDto & {
  clientId?: string;
  pending?: boolean;
  failed?: boolean;
  _retryFile?: File;
};

import { useAuthStore } from "./useAuthStore";

interface ChatState {
  messages: ConversationMessage[];
  setMessages: (messages: ConversationMessage[]) => void;
  replaceMessage: (tempId: string, message: ConversationMessage) => void;
  removeMessage: (id: string) => void;
  markMessageFailed: (id: string) => void;
  markMessagePending: (id: string) => void;
  updateMessageReactions: (messageId: string, reactions: ReactionDto[]) => void;
  updateMessageReadBy: (messageIds: string[], readerId: string) => void;

  selectedConversation?: ConversationResponseDto;
  setSelectedConversation: (conv?: ConversationResponseDto) => void;

  pendingScrollToMessageId: string | null;
  setPendingScrollToMessageId: (id: string | null) => void;
  highlightedMessageId: string | null;
  setHighlightedMessageId: (id: string | null) => void;

  subscribeToMessages: () => () => void;
  unsubscribeFromMessages: () => void;

  unreadIncomingCount: number;
  firstUnreadIndex: number;
  addIncomingUnread: (index: number) => void;
  setFirstUnreadIndex: (index: number) => void;
  clearIncomingUnread: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  setMessages: (messages) => set({ messages }),
  replaceMessage: (tempId, message) =>
    set({
      messages: get().messages.map((m) =>
        m._id === tempId ? { ...message, clientId: m.clientId } : m,
      ),
    }),
  removeMessage: (id) =>
    set({ messages: get().messages.filter((m) => m._id !== id) }),
  markMessageFailed: (id) =>
    set({
      messages: get().messages.map((m) =>
        m._id === id ? { ...m, failed: true, pending: false } : m,
      ),
    }),
  markMessagePending: (id) =>
    set({
      messages: get().messages.map((m) =>
        m._id === id ? { ...m, failed: false, pending: true } : m,
      ),
    }),
  updateMessageReactions: (messageId, reactions) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m._id === messageId ? { ...m, reactions } : m,
      ),
    })),
  updateMessageReadBy: (messageIds, readerId) => {
    const conv = get().selectedConversation;
    const reader = conv?.members.find((m) => m._id === readerId) ?? {
      _id: readerId,
      fullname: "",
    };
    set((s) => ({
      messages: s.messages.map((m) => {
        if (!messageIds.includes(m._id)) return m;
        if ((m.readBy ?? []).some((u) => u._id === readerId)) return m;
        return { ...m, readBy: [...(m.readBy ?? []), reader] };
      }),
    }));
  },

  selectedConversation: void 0,
  setSelectedConversation: (conv) =>
    set({
      selectedConversation: conv,
      pendingScrollToMessageId: null,
      highlightedMessageId: null,
    }),

  pendingScrollToMessageId: null,
  setPendingScrollToMessageId: (id) => set({ pendingScrollToMessageId: id }),
  highlightedMessageId: null,
  setHighlightedMessageId: (id) => set({ highlightedMessageId: id }),

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const convId = get().selectedConversation?._id;

    const newMessageHandler = (newMessage: MessageDto) => {
      if (newMessage.conversation._id !== get().selectedConversation?._id) return;
      set({ messages: [...get().messages, newMessage] });
      queryClient.invalidateQueries({
        queryKey: getGetConversationListQueryKey(),
      });
    };

    const reactionHandler = ({
      messageId,
      reactions,
    }: {
      messageId: string;
      reactions: ReactionDto[];
    }) => {
      get().updateMessageReactions(messageId, reactions);
    };

    const messagesReadHandler = ({
      messageIds,
      readerId,
      conversationId,
    }: {
      messageIds: string[];
      readerId: string;
      conversationId: string;
    }) => {
      if (conversationId !== get().selectedConversation?._id) return;
      get().updateMessageReadBy(messageIds, readerId);
    };

    const conversationDissolvedHandler = ({
      conversationId,
    }: {
      conversationId: string;
    }) => {
      queryClient.invalidateQueries({
        queryKey: getGetConversationListQueryKey(),
      });
      const { selectedConversation, setSelectedConversation } = get();
      if (selectedConversation?._id === conversationId) {
        setSelectedConversation(void 0);
      }
    };

    const conversationUpdatedHandler = (conv: ConversationResponseDto) => {
      queryClient.invalidateQueries({
        queryKey: getGetConversationListQueryKey(),
      });
      const { selectedConversation, setSelectedConversation } = get();
      if (selectedConversation?._id === conv._id) {
        setSelectedConversation(conv);
      }
    };

    socket?.on("newMessage", newMessageHandler);
    socket?.on("reactionUpdated", reactionHandler);
    socket?.on("messagesRead", messagesReadHandler);
    socket?.on("conversationDissolved", conversationDissolvedHandler);
    socket?.on("conversationUpdated", conversationUpdatedHandler);

    return () => {
      socket?.off("newMessage", newMessageHandler);
      socket?.off("reactionUpdated", reactionHandler);
      socket?.off("messagesRead", messagesReadHandler);
      socket?.off("conversationDissolved", conversationDissolvedHandler);
      socket?.off("conversationUpdated", conversationUpdatedHandler);
    };

    void convId; // suppress unused warning
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
  },
  unreadIncomingCount: 0,
  firstUnreadIndex: -1,
  addIncomingUnread: (index) =>
    set((s) => ({
      unreadIncomingCount: s.unreadIncomingCount + 1,
      firstUnreadIndex: s.firstUnreadIndex === -1 ? index : s.firstUnreadIndex,
    })),
  setFirstUnreadIndex: (index) => set({ firstUnreadIndex: index }),
  clearIncomingUnread: () =>
    set({ unreadIncomingCount: 0, firstUnreadIndex: -1 }),
}));
