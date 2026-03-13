import type {
  ReactionDto,
  MessageResponseDto,
  ConversationResponseDto,
  UserSummaryDto,
} from "./types";

export type { ReactionDto, UserSummaryDto };
export type MessageDto = MessageResponseDto;
export type ConversationDto = ConversationResponseDto;

export interface ServerToClientEvents {
  newMessage: (msg: MessageDto) => void;
  reactionUpdated: (data: { messageId: string; reactions: ReactionDto[] }) => void;
  messagesRead: (data: { messageIds: string[]; readerId: string; conversationId: string }) => void;
  getOnlineUsers: (userIds: string[]) => void;
  conversationUpdated: (conv: ConversationDto) => void;
  conversationDissolved: (data: { conversationId: string }) => void;
  conversationCreated: (conv: ConversationDto) => void;
}

export interface ClientToServerEvents {
  sendMessage: (
    data: { conversationId: string; text?: string; imageUrl?: string },
    ack: (result: MessageDto | { error: string }) => void,
  ) => void;
  toggleReaction: (data: { messageId: string; emoji: string }) => void;
  markRead: (data: { messageIds: string[]; conversationId: string }) => void;
}
