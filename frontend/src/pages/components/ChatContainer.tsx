import { useVirtualizer } from "@tanstack/react-virtual";
import { type FC, useCallback, useEffect } from "react";

import { sendGroupMessage } from "@/api/endpoints/group";
import { getGetUsersListQueryKey, usePostMessage } from "@/api/endpoints/message";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import type { ConversationMessage } from "@/types/conversation";
import { normalizeGroupMessage } from "@/types/conversation";

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
    selectedUser,
    messages,
    setMessages,
    replaceMessage,
    markMessageFailed,
    markMessagePending,
    subscribeToMessages,
    selectedGroup,
    unreadIncomingCount,
    firstUnreadIndex,
    highlightedMessageId,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { mutate: sendMessage } = usePostMessage();

  const { messages: fetchedMessages, isLoading } = useConversationMessages();

  const activeId = selectedUser?._id ?? selectedGroup?._id;

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 80,
    overscan: 5,
    measureElement: (el) => el?.getBoundingClientRect().height ?? 0,
  });

  const { scrollContainerRef, bottomSentinelRef } = useScrollManager({
    messages,
    selectedUserId: activeId,
    scrollToIndex: virtualizer.scrollToIndex,
  });

  const { observerRef } = useMarkRead({
    userId: selectedUser?._id,
    groupId: selectedGroup?._id,
  });

  useEffect(() => {
    setMessages(fetchedMessages);
  }, [fetchedMessages, setMessages]);

  useEffect(() => {
    if (selectedUser?._id) {
      queryClient.invalidateQueries({ queryKey: getGetUsersListQueryKey() });
    }
  }, [fetchedMessages, selectedUser?._id]);

  useEffect(() => subscribeToMessages(), [subscribeToMessages, activeId]);

  const handleRetry = useCallback(
    (message: ConversationMessage) => {
      markMessagePending(message._id);
      if (selectedGroup) {
        sendGroupMessage(selectedGroup._id, {
          text: message.text,
          image: message._retryFile,
        })
          .then((newMsg) => {
            if (message.image?.startsWith("blob:"))
              URL.revokeObjectURL(message.image);
            replaceMessage(message._id, normalizeGroupMessage(newMsg));
          })
          .catch(() => markMessageFailed(message._id));
      } else {
        sendMessage(
          {
            id: selectedUser!._id,
            data: { text: message.text, image: message._retryFile },
          },
          {
            onSuccess: (newMsg) => {
              if (message.image?.startsWith("blob:"))
                URL.revokeObjectURL(message.image);
              replaceMessage(message._id, { ...newMsg, senderId: newMsg.senderId, isRead: newMsg.isRead, reactions: newMsg.reactions });
            },
            onError: () => markMessageFailed(message._id),
          },
        );
      }
    },
    [
      selectedUser,
      selectedGroup,
      sendMessage,
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
              const isUnreadForObserver = selectedGroup
                ? message.senderId !== authUser?._id &&
                  !(message.readBy ?? []).includes(authUser!._id) &&
                  !message.pending &&
                  !message.failed
                : message.senderId !== authUser?._id &&
                  message.isRead === false &&
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
                    selectedUserPic={selectedUser?.profilePic ?? ""}
                    imageSlides={imageSlides}
                    onRetry={handleRetry}
                    isFirstUnread={vItem.index === firstUnreadIndex}
                    isHighlighted={message._id === highlightedMessageId}
                    showSenderInfo={
                      selectedGroup && message.sender && message.senderId !== authUser?._id
                        ? {
                            name: message.sender.fullname,
                            pic: message.sender.profilePic ?? "",
                          }
                        : undefined
                    }
                    isGroupChat={!!selectedGroup}
                    groupId={selectedGroup?._id}
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
