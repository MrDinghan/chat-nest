import { create } from "zustand";

import type {
  MessageResponseDto,
  OmitUserResponseDtoPassword,
} from "@/api/endpoints/chatNestAPI.schemas";

export type ChatMessage = MessageResponseDto & {
  clientId?: string;
  pending?: boolean;
  failed?: boolean;
  _retryFile?: File;
};

import { useAuthStore } from "./useAuthStore";

interface ChatState {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  replaceMessage: (tempId: string, message: MessageResponseDto) => void;
  removeMessage: (id: string) => void;
  markMessageFailed: (id: string) => void;
  markMessagePending: (id: string) => void;
  selectedUser?: OmitUserResponseDtoPassword;
  setSelectedUser: (user?: OmitUserResponseDtoPassword) => void;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
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
  selectedUser: undefined,
  setSelectedUser: (user) => set({ selectedUser: user }),
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket?.on("newMessage", (newMessage: MessageResponseDto) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
  },
}));
