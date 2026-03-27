import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Plus } from "lucide-react";
import {
  type CSSProperties,
  type FC,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import type { ReactionDto } from "@/api/endpoints/chatNestAPI.schemas";
import { useAuthStore } from "@/stores/useAuthStore";

interface MessageReactionsProps {
  messageId: string;
  reactions: ReactionDto[];
  authUserId: string;
  isMine: boolean;
}

const PICKER_HEIGHT = 435;
const PICKER_WIDTH = 352;
const SCREEN_MARGIN = 8;

const MessageReactions: FC<MessageReactionsProps> = ({
  messageId,
  reactions,
  authUserId,
  isMine,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStyle, setPickerStyle] = useState<CSSProperties>({});
  const pickerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const socket = useAuthStore((s) => s.socket);

  // Aggregate reactions: emoji -> { count, isMine }
  const aggregated = reactions.reduce<
    Map<string, { count: number; isMine: boolean }>
  >((map, r) => {
    const existing = map.get(r.emoji) ?? { count: 0, isMine: false };
    map.set(r.emoji, {
      count: existing.count + 1,
      isMine: existing.isMine || r.userId === authUserId,
    });
    return map;
  }, new Map());

  const toggleReaction = (emoji: string) => {
    socket?.emit("toggleReaction", { messageId, emoji });
  };

  const handlePickerSelect = (emoji: { native: string }) => {
    toggleReaction(emoji.native);
    setPickerOpen(false);
  };

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  return (
    <div
      className={`flex items-center gap-1 flex-wrap mt-1 relative ${isMine ? "justify-end" : "justify-start"}`}
    >
      {/* Reaction pills */}
      {Array.from(aggregated.entries()).map(
        ([emoji, { count, isMine: mine }]) => (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-sm border transition-colors
            ${
              mine
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-base-200 border-base-300 text-base-content hover:bg-base-300"
            }`}
          >
            <span>{emoji}</span>
            <span className="text-xs font-medium">{count}</span>
          </button>
        ),
      )}

      {/* "+" add reaction button */}
      <div className={`absolute top-0 ${isMine ? "-left-7" : "-right-7"}`}>
        <button
          ref={btnRef}
          onClick={() => {
            if (!pickerOpen && btnRef.current) {
              const rect = btnRef.current.getBoundingClientRect();
              const openAbove = rect.top > PICKER_HEIGHT;
              const idealLeft = isMine
                ? rect.right - PICKER_WIDTH
                : rect.left;
              const left = Math.max(
                SCREEN_MARGIN,
                Math.min(idealLeft, window.innerWidth - PICKER_WIDTH - SCREEN_MARGIN),
              );
              setPickerStyle({
                position: "fixed",
                zIndex: 50,
                left,
                ...(openAbove
                  ? { bottom: window.innerHeight - rect.top }
                  : { top: rect.bottom }),
              });
            }
            setPickerOpen((v) => !v);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center size-6 rounded-full bg-base-200 border border-base-300 hover:bg-base-300 text-base-content/60"
        >
          <Plus size={12} />
        </button>

        {pickerOpen &&
          createPortal(
            <div ref={pickerRef} style={pickerStyle}>
              <Picker
                data={data}
                onEmojiSelect={handlePickerSelect}
                theme="auto"
                previewPosition="none"
                skinTonePosition="none"
              />
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
};

export default MessageReactions;
