import {
  ClientToServerEvents,
  MessageDto,
  ServerToClientEvents,
} from "@shared/socket-events";
import express, { Express } from "express";
import http from "http";
import { Server } from "socket.io";

import Conversation from "@/models/conversation.model";
import Message from "@/models/message.model";
import User from "@/models/user.model";

const app: Express = express();
const server = http.createServer(app);

const userSocketMap: Record<string, string> = {};

export const getReceiverSocketId = (userId: string) => {
  return userSocketMap[userId];
};

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const { userId } = socket.handshake.query;
  if (typeof userId !== "string" || !userId) {
    socket.disconnect();
    return;
  }

  userSocketMap[userId] = socket.id;

  // Join all conversation rooms this user belongs to
  Conversation.find({ members: userId }).then((convs) => {
    for (const conv of convs) {
      socket.join(`conv:${conv._id}`);
    }
  });

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Send message via socket with ack
  socket.on("sendMessage", async ({ conversationId, text, imageUrl }, ack) => {
    try {
      if (!userId) return ack({ error: "Not authenticated" });
      if (!text && !imageUrl)
        return ack({ error: "Message must contain text or image" });

      const conv = await Conversation.findById(conversationId);
      if (!conv) return ack({ error: "Conversation not found" });
      if (!conv.members.some((m) => m.toString() === userId)) {
        return ack({ error: "Not a member of this conversation" });
      }

      const newMessage = new Message({
        conversationId,
        senderId: userId,
        text,
        image: imageUrl,
        readBy: [],
        reactions: [],
      });
      await newMessage.save();

      const senderDoc = await User.findById(userId)
        .select("fullname profilePic _id")
        .lean();

      const msgDto: MessageDto = {
        _id: newMessage._id.toString(),
        conversationId: conversationId,
        senderId: userId,
        sender: senderDoc
          ? {
              _id: senderDoc._id.toString(),
              fullname: senderDoc.fullname,
              profilePic: senderDoc.profilePic,
            }
          : void 0,
        text: newMessage.text,
        image: newMessage.image,
        readBy: [],
        reactions: [],
        createdAt: newMessage.createdAt,
        updatedAt: newMessage.updatedAt,
      };

      // Broadcast to all OTHER members in the conv room
      socket.to(`conv:${conversationId}`).emit("newMessage", msgDto);

      // Return to sender via ack
      ack(msgDto);
    } catch (err) {
      console.error("sendMessage error", err);
      ack({ error: "Failed to send message" });
    }
  });

  // Toggle emoji reaction
  socket.on("toggleReaction", async ({ messageId, emoji }) => {
    const message = await Message.findById(messageId);
    if (!message) return;

    const idx = message.reactions.findIndex(
      (r) => r.emoji === emoji && r.userId === userId,
    );
    if (idx >= 0) {
      message.reactions.splice(idx, 1);
    } else {
      message.reactions.push({ emoji, userId });
    }
    await message.save();

    const payload = { messageId, reactions: message.reactions };
    io.to(`conv:${message.conversationId}`).emit("reactionUpdated", payload);
  });

  // Mark messages as read
  socket.on("markRead", async ({ messageIds, conversationId }) => {
    if (!userId) return;

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        conversationId,
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId } },
    );

    io.to(`conv:${conversationId}`).emit("messagesRead", {
      messageIds,
      readerId: userId,
      conversationId,
    });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };
