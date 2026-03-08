import mongoose, { Document, Schema } from "mongoose";

export interface IUnreadCount extends Document {
  userId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  count: number;
}

const unreadCountSchema = new Schema<IUnreadCount>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  count: { type: Number, default: 0 },
});

unreadCountSchema.index({ userId: 1, senderId: 1 }, { unique: true });

const UnreadCount = mongoose.model<IUnreadCount>("UnreadCount", unreadCountSchema);
export default UnreadCount;
