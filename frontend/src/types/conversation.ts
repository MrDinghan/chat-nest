import type {
  GroupMessageResponseDto,
  MessageResponseDto,
  ReactionDto,
} from "@/api/endpoints/chatNestAPI.schemas";

export interface ConversationMessage {
  _id: string;
  clientId?: string;
  pending?: boolean;
  failed?: boolean;
  _retryFile?: File;
  senderId: string;
  sender?: { _id: string; fullname: string; profilePic?: string };
  text?: string;
  image?: string;
  isRead?: boolean;
  reactions?: ReactionDto[];
  readBy?: string[];
  createdAt: string;
  updatedAt: string;
}

export function normalizeDmMessage(m: MessageResponseDto): ConversationMessage {
  return {
    _id: m._id,
    senderId: m.senderId,
    text: m.text,
    image: m.image,
    isRead: m.isRead,
    reactions: m.reactions,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

export function normalizeGroupMessage(
  m: GroupMessageResponseDto,
): ConversationMessage {
  return {
    _id: m._id,
    senderId: m.senderId,
    sender: {
      _id: m.senderId,
      fullname: m.sender.fullname,
      profilePic: m.sender.profilePic,
    },
    text: m.text,
    image: m.image,
    reactions: m.reactions ?? [],
    readBy: m.readBy ?? [],
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}
