import { create } from "zustand";

import type {
  MessageResponseDto,
  OmitUserResponseDtoPassword,
} from "@/api/endpoints/chatNestAPI.schemas";
import { resetUnread } from "@/api/endpoints/message";
import { getGetUsersListQueryKey } from "@/api/endpoints/message";
import { queryClient } from "@/lib/queryClient";

import { useAuthStore } from "./useAuthStore";

export type ChatMessage = MessageResponseDto & {
  clientId?: string;
  pending?: boolean;
  failed?: boolean;
  _retryFile?: File;
};

interface ChatState {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  replaceMessage: (tempId: string, message: MessageResponseDto) => void;
  removeMessage: (id: string) => void;
  markMessageFailed: (id: string) => void;
  markMessagePending: (id: string) => void;
  selectedUser?: OmitUserResponseDtoPassword;
  setSelectedUser: (user?: OmitUserResponseDtoPassword) => void;
  subscribeToMessages: () => () => void;
  unsubscribeFromMessages: () => void;
  unreadIncomingCount: number;
  firstUnreadIndex: number;
  addIncomingUnread: (index: number) => void;
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
  selectedUser: void 0,
  setSelectedUser: (user) => set({ selectedUser: user }),
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    const handler = (newMessage: MessageResponseDto) => {
      const { selectedUser } = get();
      if (newMessage.senderId !== selectedUser?._id) return;
      set({ messages: [...get().messages, newMessage] });
      // Reset unread count since user is actively viewing this chat
      resetUnread(newMessage.senderId).then(() => {
        queryClient.invalidateQueries({ queryKey: getGetUsersListQueryKey() });
      });
    };

    socket?.on("newMessage", handler);
    return () => {
      socket?.off("newMessage", handler);
    };
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
  clearIncomingUnread: () => set({ unreadIncomingCount: 0, firstUnreadIndex: -1 }),
}));
