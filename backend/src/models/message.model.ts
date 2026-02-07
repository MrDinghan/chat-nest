import mongoose from "mongoose";

import { MessageResponseDto } from "./message.response.dto";

const messageSchema = new mongoose.Schema<MessageResponseDto>(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String },
    image: { type: String },
  },
  {
    timestamps: true,
  },
);

const Message = mongoose.model<MessageResponseDto>("Message", messageSchema);

export default Message;
