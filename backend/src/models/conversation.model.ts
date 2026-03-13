import type { IConversationSchema } from "@shared/types";
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema<IConversationSchema>(
  {
    type: { type: String, enum: ["dm", "group"], required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    name: { type: String },
    avatar: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
