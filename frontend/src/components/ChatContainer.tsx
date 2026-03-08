import { useVirtualizer } from "@tanstack/react-virtual";
import { AlertCircle, CheckCircle2, Circle } from "lucide-react";
import {
  type FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

import {
  getGetUsersListQueryKey,
  markRead,
  useGetMessages,
  usePostMessage,
} from "@/api/endpoints/message";
import { queryClient } from "@/lib/queryClient";
import { formatChatTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ChatMessage } from "@/stores/useChatStore";
import { useChatStore } from "@/stores/useChatStore";

import ChatHeader from "./ChatHeader";
import ChatImage from "./ChatImage";
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
    unreadIncomingCount,
    firstUnreadIndex,
    addIncomingUnread,
    clearIncomingUnread,
    markMessagesReadByIds,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(false);
  const isAtBottom = useRef(true);
  const prevMessagesLengthRef = useRef(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingReadRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (messagesData && selectedUser?._id) {
      queryClient.invalidateQueries({ queryKey: getGetUsersListQueryKey() });
    }
  }, [messagesData, selectedUser?._id]);

  useEffect(() => {
    isInitialLoad.current = true;
    isAtBottom.current = true;
    prevMessagesLengthRef.current = 0;
    clearIncomingUnread();
  }, [clearIncomingUnread, selectedUser?._id]);

  useEffect(() => {
    if (!messages || messages.length === 0) {
      prevMessagesLengthRef.current = 0;
      return;
    }
    const prev = prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;
    if (prev === 0) return;
    for (let i = prev; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.senderId !== authUser?._id && !msg.pending && !msg.failed) {
        if (!isAtBottom.current) {
          addIncomingUnread(i);
        }
      }
    }
  }, [addIncomingUnread, authUser?._id, messages]);

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

  const flushMarkRead = useCallback(() => {
    const ids = [...pendingReadRef.current];
    if (ids.length === 0) return;
    pendingReadRef.current.clear();
    markRead({ messageIds: ids }).then(() => {
      queryClient.invalidateQueries({ queryKey: getGetUsersListQueryKey() });
    });
    markMessagesReadByIds(ids);
  }, [markMessagesReadByIds]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.msgId;
            if (id) {
              pendingReadRef.current.add(id);
              observerRef.current?.unobserve(entry.target);
            }
          }
        });
        if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
        flushTimerRef.current = setTimeout(flushMarkRead, 300);
      },
      { threshold: 0.5 },
    );

    return () => {
      observerRef.current?.disconnect();
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushMarkRead();
    };
  }, [selectedUser?._id, flushMarkRead]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (isAtBottom.current) clearIncomingUnread();
  }, [clearIncomingUnread]);

  const handleScrollToUnread = useCallback(() => {
    if (firstUnreadIndex < 0) return;
    virtualizer.scrollToIndex(firstUnreadIndex, {
      align: "start",
      behavior: "smooth",
    });
  }, [firstUnreadIndex, virtualizer]);

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

      <div className="flex-1 relative overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto p-4"
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
                  ref={(el) => {
                    virtualizer.measureElement(el);
                    if (
                      el &&
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
                  {vItem.index === firstUnreadIndex && (
                    <div className="flex items-center gap-2 mb-3 px-2">
                      <div className="flex-1 h-px bg-base-300" />
                      <span className="text-xs text-base-content/50 whitespace-nowrap">
                        New Message{firstUnreadIndex > 0 ? "s" : ""}
                      </span>
                      <div className="flex-1 h-px bg-base-300" />
                    </div>
                  )}
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
                    {message.senderId === authUser?._id ? (
                      <div className="flex items-end gap-1.5 justify-end">
                        {!message.pending && !message.failed && (
                          <div className="shrink-0 mb-1">
                            {message.isRead ? (
                              <CheckCircle2
                                size={14}
                                className="text-success"
                                strokeWidth={2}
                              />
                            ) : (
                              <Circle
                                size={14}
                                className="text-base-content/30"
                                strokeWidth={1.5}
                              />
                            )}
                          </div>
                        )}
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
                      </div>
                    ) : (
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
                    )}
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
