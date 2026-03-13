import { useVirtualizer } from "@tanstack/react-virtual";
import { type FC, useCallback, useEffect } from "react";

import { uploadImage } from "@/api/endpoints/conversation";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ConversationMessage } from "@/stores/useChatStore";
import { useChatStore } from "@/stores/useChatStore";

import { useConversationMessages } from "../hooks/useConversationMessages";
import { useMarkRead } from "../hooks/useMarkRead";
import { useScrollManager } from "../hooks/useScrollManager";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import NewMessageBanner from "./NewMessageBanner";
import MessageSkeleton from "./skeletons/MessageSkeleton";

const ChatContainer: FC = () => {
  const {
    selectedConversation,
    messages,
    setMessages,
    replaceMessage,
    markMessageFailed,
    markMessagePending,
    subscribeToMessages,
    unreadIncomingCount,
    firstUnreadIndex,
    highlightedMessageId,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();

  const { messages: fetchedMessages, isLoading } = useConversationMessages();

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 80,
    overscan: 5,
    measureElement: (el) => el?.getBoundingClientRect().height ?? 0,
  });

  const { scrollContainerRef, bottomSentinelRef } = useScrollManager({
    messages,
    selectedUserId: selectedConversation?._id,
    scrollToIndex: virtualizer.scrollToIndex,
  });

  const { observerRef } = useMarkRead({
    conversationId: selectedConversation?._id,
  });

  useEffect(() => {
    setMessages(fetchedMessages);
  }, [fetchedMessages, setMessages]);

  useEffect(
    () => subscribeToMessages(),
    [subscribeToMessages, selectedConversation?._id],
  );

  const handleRetry = useCallback(
    async (message: ConversationMessage) => {
      if (!selectedConversation) return;
      markMessagePending(message._id);

      try {
        let imageUrl: string | undefined;
        if (message._retryFile) {
          const result = await uploadImage({ image: message._retryFile });
          imageUrl = result.imageUrl;
        }

        socket?.emit(
          "sendMessage",
          {
            conversationId: selectedConversation._id,
            text: message.text,
            imageUrl,
          },
          (result) => {
            if (message.image?.startsWith("blob:"))
              URL.revokeObjectURL(message.image);
            if ("error" in result) {
              markMessageFailed(message._id);
            } else {
              replaceMessage(message._id, result);
            }
          },
        );
      } catch {
        markMessageFailed(message._id);
      }
    },
    [
      selectedConversation,
      socket,
      markMessagePending,
      replaceMessage,
      markMessageFailed,
    ],
  );

  const handleScrollToUnread = useCallback(() => {
    if (firstUnreadIndex < 0) return;
    virtualizer.scrollToIndex(firstUnreadIndex, {
      align: "start",
      behavior: "smooth",
    });
  }, [firstUnreadIndex, virtualizer]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const imageSlides = messages
    .filter((m) => m.image && !m.pending && !m.failed)
    .map((m) => ({ src: m.image! }));

  const conversationType = selectedConversation?.type ?? "dm";
  const otherMember =
    conversationType === "dm"
      ? selectedConversation?.members.find((m) => m._id !== authUser?._id)
      : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeader />

      <div className="flex-1 relative overflow-hidden">
        <div ref={scrollContainerRef} className="h-full overflow-y-auto p-4">
          <div
            style={{ height: virtualizer.getTotalSize(), position: "relative" }}
          >
            {virtualizer.getVirtualItems().map((vItem) => {
              const message = messages[vItem.index];
              const isUnreadForObserver =
                message.sender._id !== authUser?._id &&
                !(message.readBy ?? []).some((u) => u._id === authUser!._id) &&
                !message.pending &&
                !message.failed;

              return (
                <div
                  key={message.clientId ?? message._id}
                  data-index={vItem.index}
                  ref={(el) => {
                    virtualizer.measureElement(el);
                    if (el && isUnreadForObserver) {
                      el.dataset.msgId = message._id;
                      observerRef.current?.observe(el);
                    }
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    width: "100%",
                    transform: `translateY(${vItem.start}px)`,
                    paddingBottom: "1rem",
                  }}
                >
                  <MessageBubble
                    message={message}
                    authUserId={authUser!._id}
                    authUserPic={authUser?.profilePic ?? ""}
                    otherPic={otherMember?.profilePic ?? ""}
                    imageSlides={imageSlides}
                    onRetry={handleRetry}
                    isFirstUnread={vItem.index === firstUnreadIndex}
                    isHighlighted={message._id === highlightedMessageId}
                    showSenderInfo={
                      conversationType === "group" &&
                      message.sender._id !== authUser?._id
                        ? {
                            name: message.sender.fullname ?? "",
                            pic: message.sender.profilePic ?? "",
                          }
                        : void 0
                    }
                    conversationType={conversationType}
                  />
                </div>
              );
            })}
          </div>
          <div ref={bottomSentinelRef} />
        </div>

        {unreadIncomingCount > 0 && (
          <NewMessageBanner
            count={unreadIncomingCount}
            onClick={handleScrollToUnread}
          />
        )}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
