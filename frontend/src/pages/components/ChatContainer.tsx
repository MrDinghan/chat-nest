import { useVirtualizer } from "@tanstack/react-virtual";
import { type FC, useCallback, useEffect } from "react";

import { useGetGroupMessages } from "@/api/endpoints/group";
import {
  getGetUsersListQueryKey,
  useGetMessages,
  usePostMessage,
} from "@/api/endpoints/message";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ChatMessage } from "@/stores/useChatStore";
import { useChatStore } from "@/stores/useChatStore";

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
    subscribeToGroupMessages,
    selectedGroup,
    groupMessages,
    setGroupMessages,
    unreadIncomingCount,
    firstUnreadIndex,
    highlightedMessageId,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const { mutate: sendMessage } = usePostMessage();

  const { data: messagesData, isLoading: isDmLoading } = useGetMessages(
    selectedUser?._id ?? "",
    { query: { enabled: !!selectedUser } },
  );

  const { data: groupMessagesData, isLoading: isGroupLoading } =
    useGetGroupMessages(selectedGroup?._id ?? "", {
      query: { enabled: !!selectedGroup },
    });

  const isMessagesLoading = selectedGroup ? isGroupLoading : isDmLoading;

  // Unified message list for virtualizer
  const displayMessages = selectedGroup
    ? groupMessages.map((m) => ({
        ...m,
        // adapt GroupChatMessage to match virtualizer expectations
        receiverId: m.groupId,
        isRead: true,
        reactions: [],
      }))
    : messages;

  const virtualizer = useVirtualizer({
    count: displayMessages?.length ?? 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 80,
    overscan: 5,
    measureElement: (el) => el?.getBoundingClientRect().height ?? 0,
  });

  const { scrollContainerRef, bottomSentinelRef } = useScrollManager({
    messages: displayMessages,
    selectedUserId: selectedUser?._id ?? selectedGroup?._id,
    scrollToIndex: virtualizer.scrollToIndex,
  });

  const { observerRef } = useMarkRead(selectedUser?._id);

  useEffect(() => {
    if (selectedUser) setMessages(messagesData ?? []);
  }, [messagesData, setMessages, selectedUser]);

  useEffect(() => {
    if (selectedGroup) setGroupMessages(groupMessagesData ?? []);
  }, [groupMessagesData, setGroupMessages, selectedGroup]);

  useEffect(() => {
    if (messagesData && selectedUser?._id) {
      queryClient.invalidateQueries({ queryKey: getGetUsersListQueryKey() });
    }
  }, [messagesData, selectedUser?._id]);

  useEffect(() => {
    if (selectedUser) return subscribeToMessages();
  }, [subscribeToMessages, selectedUser]);

  useEffect(() => {
    if (selectedGroup) return subscribeToGroupMessages();
  }, [subscribeToGroupMessages, selectedGroup]);

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

  const handleScrollToUnread = useCallback(() => {
    if (firstUnreadIndex < 0) return;
    virtualizer.scrollToIndex(firstUnreadIndex, {
      align: "start",
      behavior: "smooth",
    });
  }, [firstUnreadIndex, virtualizer]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const imageSlides = selectedGroup
    ? groupMessages
        .filter((m) => m.image && !m.pending && !m.failed)
        .map((m) => ({ src: m.image! }))
    : (messages ?? [])
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
              const message = displayMessages![vItem.index];
              const groupMsg = selectedGroup
                ? groupMessages[vItem.index]
                : undefined;

              return (
                <div
                  key={message.clientId ?? message._id}
                  data-index={vItem.index}
                  ref={(el) => {
                    virtualizer.measureElement(el);
                    if (
                      el &&
                      !selectedGroup &&
                      message.senderId !== authUser?._id &&
                      !message.isRead &&
                      !message.pending &&
                      !message.failed
                    ) {
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
                      selectedGroup &&
                      groupMsg &&
                      groupMsg.senderId !== authUser?._id
                        ? {
                            name: groupMsg.sender.fullname,
                            pic: groupMsg.sender.profilePic ?? "",
                          }
                        : undefined
                    }
                    isGroupMessage={!!selectedGroup}
                  />
                </div>
              );
            })}
          </div>
          <div ref={bottomSentinelRef} />
        </div>

        {!selectedGroup && unreadIncomingCount > 0 && (
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
