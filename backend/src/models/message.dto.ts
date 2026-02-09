import mongoose from "mongoose";

export interface IMessageDTO {
  /**
   * Message content
   * @example "Hello, how are you?"
   * */
  text?: string;
  /**
   * Message image URL
   * @example "https://example.com/image.jpg"
   * */
  image?: string;
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
}
