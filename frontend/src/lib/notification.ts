import type {
  MessageResponseDto,
  OmitUserResponseDtoPassword,
} from "@/api/endpoints/chatNestAPI.schemas";
import { useChatStore } from "@/stores/useChatStore";

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

export function showMessageNotification(
  message: MessageResponseDto,
  users: OmitUserResponseDtoPassword[],
) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const sender = users.find((u) => u._id === message.senderId);
  const title = sender?.fullname ?? "New Message";
  const body = message.text || (message.image ? "[picture]" : "");
  const icon = sender?.profilePic || "/avatar.png";

  const n = new Notification(title, { body, icon });
  n.onclick = () => {
    window.focus();
    n.close();
    const { setSelectedUser, setPendingScrollToMessageId } =
      useChatStore.getState();
    if (sender) {
      setSelectedUser(sender);
      setPendingScrollToMessageId(message._id);
    }
  };
}
