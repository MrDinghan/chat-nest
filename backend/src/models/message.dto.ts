import mongoose from "mongoose";

import { BaseDocumentDto } from "./base.response.dto";

export interface ReactionDto {
  emoji: string;
  userId: string;
}

export interface IMessageDTO extends BaseDocumentDto {
  /**
   * Message content
   * @example "Hello, how are you?"
   * */
  text: string | undefined;
  /**
   * Message image URL
   * @example "https://example.com/image.jpg"
   * */
  image: string | undefined;
  /**
   * Sender's user ID
   * @example "507f1f77bcf86cd799439011"
   * */
  senderId: mongoose.Types.ObjectId;
  /**
   * Receiver's user ID
   * @example "507f1f77bcf86cd799439012"
   * */
  receiverId: mongoose.Types.ObjectId;
  isRead: boolean;
  reactions: ReactionDto[];
}
