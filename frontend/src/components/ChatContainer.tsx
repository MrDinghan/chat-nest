import { useVirtualizer } from "@tanstack/react-virtual";
import { AlertCircle } from "lucide-react";
import { type FC, useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { usePostMessage } from "@/api/endpoints/message";
import { useGetMessages } from "@/api/endpoints/message";
import { formatChatTime } from "@/lib/utils";
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
  } = useChatStore();
  const { authUser } = useAuthStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(false);
  const isAtBottom = useRef(true);
  const { mutate: sendMessage } = usePostMessage();

  const { data: messagesData, isLoading: isMessagesLoading } = useGetMessages(
    selectedUser?._id ?? "",
  );

  const virtualizer = useVirtualizer({
    count: messages?.length ?? 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 80,
    overscan: 5,
    measureElement: (el) => el?.getBoundingClientRect().height ?? 0,
  });

  useEffect(() => {
    return subscribeToMessages();
  }, [subscribeToMessages, selectedUser?._id]);

  useEffect(() => {
    setMessages(messagesData ?? []);
  }, [messagesData, setMessages]);

  useEffect(() => {
    isInitialLoad.current = true;
    isAtBottom.current = true;
  }, [selectedUser?._id]);

  const totalSize = virtualizer.getTotalSize();
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !messages?.length) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      el.scrollTop = el.scrollHeight;
    } else if (isAtBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, totalSize]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

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
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeader />

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4"
        onScroll={handleScroll}
      >
        <div
          style={{ height: virtualizer.getTotalSize(), position: "relative" }}
        >
          {virtualizer.getVirtualItems().map((vItem) => {
            const message = messages![vItem.index];
            return (
              <div
                key={message.clientId ?? message._id}
                data-index={vItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  width: "100%",
                  transform: `translateY(${vItem.start}px)`,
                  paddingBottom: "1rem",
                }}
              >
                <div
                  className={`chat ${message.senderId === authUser?._id ? "chat-end" : "chat-start"}`}
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
                      {formatChatTime(message.createdAt, true)}
                    </time>
                  </div>
                  <div className="chat-bubble flex flex-col">
                    {message.image && (
                      <ChatImage
                        src={message.image}
                        slides={imageSlides}
                        index={imageSlides.findIndex(
                          (s) => s.src === message.image,
                        )}
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
                        <AlertCircle size={12} /> Failed to send. Click to
                        retry.
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
