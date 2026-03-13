export interface ReactionDto {
    emoji: string;
    userId: string;
}
export interface MessageDto {
    _id: string;
    conversationId: string;
    senderId: string;
    sender?: {
        _id: string;
        fullname: string;
        profilePic?: string;
    };
    text?: string;
    image?: string;
    readBy: string[];
    reactions: ReactionDto[];
    createdAt: string;
    updatedAt: string;
}
export interface ConversationMemberDto {
    _id: string;
    fullname: string;
    profilePic?: string;
}
export interface ConversationDto {
    _id: string;
    type: "dm" | "group";
    members: ConversationMemberDto[];
    name?: string;
    avatar?: string;
    ownerId?: string;
    createdAt: string;
    updatedAt: string;
}
export interface ServerToClientEvents {
    newMessage: (msg: MessageDto) => void;
    reactionUpdated: (data: {
        messageId: string;
        reactions: ReactionDto[];
    }) => void;
    messagesRead: (data: {
        messageIds: string[];
        readerId: string;
        conversationId: string;
    }) => void;
    getOnlineUsers: (userIds: string[]) => void;
    conversationUpdated: (conv: ConversationDto) => void;
    conversationDissolved: (data: {
        conversationId: string;
    }) => void;
    conversationCreated: (conv: ConversationDto) => void;
}
export interface ClientToServerEvents {
    sendMessage: (data: {
        conversationId: string;
        text?: string;
        imageUrl?: string;
    }, ack: (result: MessageDto | {
        error: string;
    }) => void) => void;
    toggleReaction: (data: {
        messageId: string;
        emoji: string;
    }) => void;
    markRead: (data: {
        messageIds: string[];
        conversationId: string;
    }) => void;
}
