// ── Base ──────────────────────────────────────────────────────────
export interface BaseDocumentDto {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// ── User ──────────────────────────────────────────────────────────
export interface IUser {
  email: string;
  fullname: string;
  password: string;
  profilePic?: string;
}

/** Mongoose schema generic: new Schema<IUserSchema>() */
export interface IUserSchema extends IUser, BaseDocumentDto {}

/** GET /user/list response (without password) */
export type UserResponseDto = Omit<IUserSchema, "password">;

/** Public user info referenced in other DTOs */
export type UserSummaryDto = Omit<
  UserResponseDto,
  "email" | "createdAt" | "updatedAt"
>;
// = { _id: string; fullname: string; profilePic?: string }

// ── Conversation ──────────────────────────────────────────────────
export type ConversationType = "dm" | "group";

export interface IConversation {
  type: ConversationType;
  members: UserSummaryDto[];
  name?: string;
  avatar?: string;
  ownerId?: string;
}

/** Mongoose schema generic: new Schema<IConversationSchema>() */
export interface IConversationSchema extends IConversation, BaseDocumentDto {}

export interface ConversationLastMessageDto {
  text?: string;
  image?: string;
  createdAt?: string;
  senderName?: string;
}

// Request types
export interface CreateGroupRequest {
  name: string;
  memberIds: string[];
}
export interface FindOrCreateDmRequest {
  memberId: string;
}

/** GET /conversation/list response */
export interface ConversationResponseDto extends IConversationSchema {
  lastMessage?: ConversationLastMessageDto;
  unreadCount?: number;
}

// ── Message ───────────────────────────────────────────────────────
export interface ReactionDto {
  emoji: string;
  userId: string;
}

export interface IMessage {
  conversationId?: string;
  senderId?: string;
  text?: string;
  image?: string;
  readBy: string[];
  reactions: ReactionDto[];
}

/** Mongoose schema generic: new Schema<IMessageSchema>() */
export interface IMessageSchema extends IMessage, BaseDocumentDto {}

/** GET /conversation/:id/messages response (with populated sender) */
export interface MessageResponseDto extends IMessageSchema {
  sender?: UserSummaryDto;
}

export interface SearchMessageResultDto {
  _id: string;
  text?: string;
  senderId: string;
  conversationId: string;
  createdAt: string;
  conversationType: ConversationType;
  conversationName?: string;
  senderName?: string;
  otherUser?: UserSummaryDto;
}
