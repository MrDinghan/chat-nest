import { AlertCircle, CheckCircle2, Circle } from "lucide-react";
import type { FC } from "react";

import Avatar from "@/components/Avatar";
import { formatChatTime } from "@/lib/utils";
import type { ConversationMessage } from "@/stores/useChatStore";

import ChatImage from "./ChatImage";
import MessageReactions from "./MessageReactions";

interface MessageBubbleProps {
  message: ConversationMessage;
  authUserId: string;
  authUserPic: string;
  authUserName?: string;
  otherPic: string;
  otherName?: string;
  imageSlides: { src: string }[];
  onRetry: (message: ConversationMessage) => void;
  isFirstUnread: boolean;
  isHighlighted?: boolean;
  showSenderInfo?: { name: string; pic: string };
  conversationType: "dm" | "group";
  totalMembers?: number;
}

const MessageBubble: FC<MessageBubbleProps> = ({
  message,
  authUserId,
  authUserPic,
  authUserName = "",
  otherPic,
  otherName = "",
  imageSlides,
  onRetry,
  isFirstUnread,
  isHighlighted,
  showSenderInfo,
  conversationType,
  totalMembers,
}) => {
  const isMine = message.sender._id === authUserId;
  const readCount = (message.readBy ?? []).filter(
    (u) => u._id !== authUserId,
  ).length;
  const allRead = conversationType === "group" && totalMembers != null && readCount >= totalMembers - 1;

  const renderReadIndicator = () => {
    if (message.pending || message.failed) return null;

    if (conversationType === "group") {
      if (allRead) return <CheckCircle2 size={14} className="text-success shrink-0 mb-1" strokeWidth={2} />;
      if (readCount > 0) return <span className="text-xs text-base-content/40 shrink-0 mb-1">{readCount} read</span>;
      return null;
    }

    return readCount > 0
      ? <CheckCircle2 size={14} className="text-success shrink-0 mb-1" strokeWidth={2} />
      : <Circle size={14} className="text-base-content/30 shrink-0 mb-1" strokeWidth={1.5} />;
  };

  return (
    <div
      className={`rounded-lg px-2 transition-colors duration-700 ${isHighlighted ? "bg-yellow-100/70" : "bg-transparent"}`}
    >
      {isFirstUnread && (
        <div className="flex items-center gap-2 mb-3 px-2">
          <div className="flex-1 h-px bg-base-300" />
          <span className="text-xs text-base-content/50 whitespace-nowrap">
            New Messages
          </span>
          <div className="flex-1 h-px bg-base-300" />
        </div>
      )}
      <div className={`chat ${isMine ? "chat-end" : "chat-start"} group`}>
        <div className="chat-image avatar">
          <div className="size-10 rounded-full border">
            <Avatar
              src={isMine ? authUserPic : showSenderInfo?.pic || otherPic}
              name={isMine ? authUserName : (showSenderInfo?.name ?? otherName)}
              className="w-full h-full rounded-full"
            />
          </div>
        </div>
        <div className="chat-header mb-1">
          {showSenderInfo && !isMine && (
            <span className="text-xs font-medium mr-1">
              {showSenderInfo.name}
            </span>
          )}
          <time className="text-xs opacity-50 ml-1">
            {formatChatTime(message.createdAt, true)}
          </time>
        </div>
        {isMine ? (
          <div className="flex items-end gap-1.5 justify-end">
            {renderReadIndicator()}
            <div className="chat-bubble chat-bubble-primary flex flex-col">
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
          </div>
        ) : (
          <div className="chat-bubble bg-base-200 text-base-content flex flex-col">
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
        )}
        <div className="chat-footer">
          {message.failed && isMine && (
            <button
              className="text-error flex items-center gap-1 text-xs mt-0.5"
              onClick={() => onRetry(message)}
            >
              <AlertCircle size={12} /> Failed to send. Click to retry.
            </button>
          )}
          {!message.pending && (
            <MessageReactions
              messageId={message._id}
              reactions={message.reactions ?? []}
              authUserId={authUserId}
              isMine={isMine}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
