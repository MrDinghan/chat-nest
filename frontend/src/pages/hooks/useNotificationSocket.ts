import type {
  ConversationResponseDto,
  MessageResponseDto,
} from "@shared/types";
import { useEffect } from "react";

import { getGetConversationListQueryKey } from "@/api/endpoints/conversation";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";

export function useNotificationSocket() {
  const { socket, authUser } = useAuthStore();

  useEffect(() => {
    if (!socket) return;

    const handler = (msg: MessageResponseDto) => {
      if (msg.sender._id === authUser?._id) return;
      if (document.hasFocus()) return;
      if (!("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      const senderName = msg.sender.fullname ?? "New Message";
      const body = msg.text || (msg.image ? "[picture]" : "");
      const icon = msg.sender.profilePic || "/avatar.png";

      const n = new Notification(senderName, { body, icon });
      n.onclick = () => {
        window.focus();
        n.close();
        const convs =
          queryClient.getQueryData<ConversationResponseDto[]>(
            getGetConversationListQueryKey(),
          ) ?? [];
        const conv = convs.find((c) => c._id === msg.conversation._id);
        if (conv) {
          useChatStore.getState().setSelectedConversation(conv);
          useChatStore.getState().setPendingScrollToMessageId(msg._id);
        }
      };
    };

    socket.on("newMessage", handler);
    return () => {
      socket.off("newMessage", handler);
    };
  }, [socket, authUser?._id]);
}
