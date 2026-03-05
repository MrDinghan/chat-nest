import { AlertCircle } from "lucide-react";
import { type FC, useCallback, useEffect, useRef } from "react";

import { usePostMessage } from "@/api/endpoints/message";
import { useGetMessages } from "@/api/endpoints/message";
import { formatMessageTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ChatMessage } from "@/stores/useChatStore";
import { useChatStore } from "@/stores/useChatStore";

import ChatHeader from "./ChatHeader";
import ChatImage from "./ChatImage";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";

const ChatContainer: FC = () => {
  const {
    selectedUser,
    messages,
    setMessages,
    replaceMessage,
    markMessageFailed,
    markMessagePending,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { mutate: sendMessage } = usePostMessage();

  const { data: messagesData, isLoading: isMessagesLoading } = useGetMessages(
    selectedUser?._id ?? "",
  );

  useEffect(() => {
    subscribeToMessages();
    return unsubscribeFromMessages;
  }, [subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    setMessages(messagesData ?? []);
  }, [messagesData, setMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleRetry = useCallback(
    (message: ChatMessage) => {
      markMessagePending(message._id);
      sendMessage(
        {
          id: selectedUser!._id,
          data: { text: message.text, image: message._retryFile },
        },
        {
          onSuccess: (newMsg) => {
            if (message.image?.startsWith("blob:"))
              URL.revokeObjectURL(message.image);
            replaceMessage(message._id, newMsg);
          },
          onError: () => markMessageFailed(message._id),
        },
      );
    },
    [
      selectedUser,
      sendMessage,
      markMessagePending,
      replaceMessage,
      markMessageFailed,
    ],
  );

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const imageSlides = (messages ?? [])
    .filter((m) => m.image && !m.pending && !m.failed)
    .map((m) => ({ src: m.image! }));

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((message) => (
          <div
            key={message.clientId ?? message._id}
            className={`chat ${message.senderId === authUser?._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser?._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser?.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <ChatImage
                  src={message.image}
                  slides={imageSlides}
                  index={imageSlides.findIndex((s) => s.src === message.image)}
                  pending={message.pending}
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
            {message.failed && message.senderId === authUser?._id && (
              <div className="chat-footer">
                <button
                  className="text-error flex items-center gap-1 text-xs mt-0.5"
                  onClick={() => handleRetry(message)}
                >
                  <AlertCircle size={12} /> Failed to send. Click to retry.
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
