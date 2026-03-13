import { IMessageSchema } from "@shared/types";
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema<IMessageSchema>(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String },
    image: { type: String },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
