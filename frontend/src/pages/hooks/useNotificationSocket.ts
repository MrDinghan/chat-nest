import { useEffect } from "react";

import type {
  GroupMessageResponseDto,
  MessageResponseDto,
  UserResponseDto,
} from "@/api/endpoints/chatNestAPI.schemas";
import { getGetUsersListQueryKey } from "@/api/endpoints/message";
import { showMessageNotification } from "@/lib/notification";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/useAuthStore";

export function useNotificationSocket() {
  const { socket, authUser } = useAuthStore();

  useEffect(() => {
    if (!socket) return;

    const handler = (msg: MessageResponseDto) => {
      // Don't notify for own messages
      if (msg.senderId === authUser?._id) return;
      // Don't notify if tab is focused
      if (document.hasFocus()) return;

      const users =
        queryClient.getQueryData<UserResponseDto[]>(
          getGetUsersListQueryKey(),
        ) ?? [];
      showMessageNotification(msg, users);
    };

    const groupHandler = (msg: GroupMessageResponseDto) => {
      // Don't notify for own messages
      if (msg.senderId === authUser?._id) return;
      // Don't notify if tab is focused
      if (document.hasFocus()) return;

      if (!("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      const title = msg.sender?.fullname ?? "New Group Message";
      const body = msg.text || (msg.image ? "[picture]" : "");
      const icon = msg.sender?.profilePic || "/avatar.png";

      const n = new Notification(title, { body, icon });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    };

    socket.on("newMessage", handler);
    socket.on("newGroupMessage", groupHandler);
    return () => {
      socket.off("newMessage", handler);
      socket.off("newGroupMessage", groupHandler);
    };
  }, [socket, authUser?._id]);
}
