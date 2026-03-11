import { create } from "zustand";

import type {
  GroupMessageResponseDto,
  GroupResponseDto,
  MessageResponseDto,
  ReactionDto,
  UserResponseDto,
} from "@/api/endpoints/chatNestAPI.schemas";
import { getGetGroupListQueryKey } from "@/api/endpoints/group";
import { getGetUsersListQueryKey } from "@/api/endpoints/message";
import { queryClient } from "@/lib/queryClient";
import type { ConversationMessage } from "@/types/conversation";
import {
  normalizeDmMessage,
  normalizeGroupMessage,
} from "@/types/conversation";

import { useAuthStore } from "./useAuthStore";

interface ChatState {
  messages: ConversationMessage[];
  setMessages: (messages: ConversationMessage[]) => void;
  replaceMessage: (tempId: string, message: ConversationMessage) => void;
  removeMessage: (id: string) => void;
  markMessageFailed: (id: string) => void;
  markMessagePending: (id: string) => void;
  markMessagesReadByIds: (ids: string[]) => void;
  updateMessageReactions: (messageId: string, reactions: ReactionDto[]) => void;
  updateMessageReadBy: (messageIds: string[], readerId: string) => void;

  selectedUser?: UserResponseDto;
  setSelectedUser: (user?: UserResponseDto) => void;

  selectedGroup?: GroupResponseDto;
  setSelectedGroup: (group?: GroupResponseDto) => void;

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
  markMessagesReadByIds: (ids) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        ids.includes(m._id) ? { ...m, isRead: true } : m,
      ),
    })),
  updateMessageReactions: (messageId, reactions) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m._id === messageId ? { ...m, reactions } : m,
      ),
    })),
  updateMessageReadBy: (messageIds, readerId) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        messageIds.includes(m._id)
          ? { ...m, readBy: [...new Set([...(m.readBy ?? []), readerId])] }
          : m,
      ),
    })),

  selectedUser: void 0,
  setSelectedUser: (user) =>
    set({
      selectedUser: user,
      selectedGroup: void 0,
      pendingScrollToMessageId: null,
      highlightedMessageId: null,
    }),

  selectedGroup: void 0,
  setSelectedGroup: (group) =>
    set({
      selectedGroup: group,
      selectedUser: void 0,
      pendingScrollToMessageId: null,
      highlightedMessageId: null,
    }),

  pendingScrollToMessageId: null,
  setPendingScrollToMessageId: (id) => set({ pendingScrollToMessageId: id }),
  highlightedMessageId: null,
  setHighlightedMessageId: (id) => set({ highlightedMessageId: id }),

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    const newMessageHandler = (newMessage: MessageResponseDto) => {
      const { selectedUser } = get();
      if (newMessage.senderId !== selectedUser?._id) return;
      set({ messages: [...get().messages, normalizeDmMessage(newMessage)] });
      queryClient.invalidateQueries({ queryKey: getGetUsersListQueryKey() });
    };

    const readHandler = ({ messageIds }: { messageIds: string[] }) => {
      get().markMessagesReadByIds(messageIds);
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

    const groupReactionHandler = ({
      messageId,
      reactions,
    }: {
      messageId: string;
      reactions: ReactionDto[];
    }) => {
      get().updateMessageReactions(messageId, reactions);
    };

    const groupMessagesReadHandler = ({
      messageIds,
      readerId,
    }: {
      messageIds: string[];
      readerId: string;
    }) => {
      get().updateMessageReadBy(messageIds, readerId);
    };

    const newGroupMessageHandler = (newMessage: GroupMessageResponseDto) => {
      const { selectedGroup } = get();
      if (newMessage.groupId !== selectedGroup?._id) return;
      set({ messages: [...get().messages, normalizeGroupMessage(newMessage)] });
    };

    const groupDissolvedHandler = ({ groupId }: { groupId: string }) => {
      queryClient.invalidateQueries({ queryKey: getGetGroupListQueryKey() });
      const { selectedGroup, setSelectedGroup } = get();
      if (selectedGroup?._id === groupId) {
        setSelectedGroup(void 0);
      }
    };

    const groupUpdatedHandler = (group: GroupResponseDto) => {
      queryClient.invalidateQueries({ queryKey: getGetGroupListQueryKey() });
      const { selectedGroup, setSelectedGroup } = get();
      if (selectedGroup?._id === group._id) {
        setSelectedGroup(group);
      }
    };

    socket?.on("newMessage", newMessageHandler);
    socket?.on("messagesRead", readHandler);
    socket?.on("reactionUpdated", reactionHandler);
    socket?.on("groupReactionUpdated", groupReactionHandler);
    socket?.on("groupMessagesRead", groupMessagesReadHandler);
    socket?.on("newGroupMessage", newGroupMessageHandler);
    socket?.on("groupDissolved", groupDissolvedHandler);
    socket?.on("groupUpdated", groupUpdatedHandler);

    return () => {
      socket?.off("newMessage", newMessageHandler);
      socket?.off("messagesRead", readHandler);
      socket?.off("reactionUpdated", reactionHandler);
      socket?.off("groupReactionUpdated", groupReactionHandler);
      socket?.off("groupMessagesRead", groupMessagesReadHandler);
      socket?.off("newGroupMessage", newGroupMessageHandler);
      socket?.off("groupDissolved", groupDissolvedHandler);
      socket?.off("groupUpdated", groupUpdatedHandler);
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
  setFirstUnreadIndex: (index) => set({ firstUnreadIndex: index }),
  clearIncomingUnread: () =>
    set({ unreadIncomingCount: 0, firstUnreadIndex: -1 }),
}));
