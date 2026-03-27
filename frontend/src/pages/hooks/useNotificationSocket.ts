import type {
  ConversationResponseDto,
  MessageResponseDto,
} from "@shared/types";
import { useEffect } from "react";

import { getGetConversationListQueryKey } from "@/api/endpoints/conversation";
import { showNotification } from "@/lib/notification";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";

export const useNotificationSocket = () => {
  const { socket, authUser } = useAuthStore();

  // Handle SW postMessage navigation
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "NOTIFICATION_CLICK") return;
      const { convId, msgId } = event.data;
      const convs =
        queryClient.getQueryData<ConversationResponseDto[]>(
          getGetConversationListQueryKey(),
        ) ?? [];
      const conv = convs.find((c) => c._id === convId);
      if (conv) {
        useChatStore.getState().setSelectedConversation(conv);
        useChatStore.getState().setPendingScrollToMessageId(msgId);
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handler);
    };
  }, []);

  // Handle incoming messages and show notifications
  useEffect(() => {
    if (!socket) return;

    const handler = (msg: MessageResponseDto) => {
      if (msg.sender._id === authUser?._id) return;
      if (document.hasFocus()) return;
      if (!("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      const isGroup = msg.conversation.type === "group";
      const title = isGroup ? (msg.conversation.name ?? "Group") : (msg.sender.fullname ?? "New Message");
      const msgPreview = msg.text || (msg.image ? "[picture]" : "");
      const body = isGroup ? `${msg.sender.fullname}: ${msgPreview}` : msgPreview;
      const icon = isGroup
        ? (msg.conversation.avatar || "/avatar.png")
        : (msg.sender.profilePic || "/avatar.png");

      showNotification(
        title,
        { body, icon },
        {
          convId: msg.conversation._id,
          msgId: msg._id,
          appUrl: window.location.origin,
        },
      );
    };

    socket.on("newMessage", handler);
    return () => {
      socket.off("newMessage", handler);
    };
  }, [socket, authUser?._id]);
};
