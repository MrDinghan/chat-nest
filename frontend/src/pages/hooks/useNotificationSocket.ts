import { useEffect } from "react";

import type {
  MessageResponseDto,
  OmitUserResponseDtoPassword,
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
        queryClient.getQueryData<OmitUserResponseDtoPassword[]>(
          getGetUsersListQueryKey(),
        ) ?? [];
      showMessageNotification(msg, users);
    };

    socket.on("newMessage", handler);
    return () => {
      socket.off("newMessage", handler);
    };
  }, [socket, authUser?._id]);
}
