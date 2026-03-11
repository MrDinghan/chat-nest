import mongoose from "mongoose";

import { GroupMessageDto } from "./groupMessage.dto";

const groupMessageSchema = new mongoose.Schema<GroupMessageDto>(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String },
    image: { type: String },
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: String, required: true },
      },
    ],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);

export default GroupMessage;
