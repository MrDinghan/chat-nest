import express, { Express } from "express";
import http from "http";
import { Server } from "socket.io";

import Group from "@/models/group.model";
import Message from "@/models/message.model";

const app: Express = express();
const server = http.createServer(app);

const userSocketMap: Record<string, string> = {};

export const getReceiverSocketId = (userId: string) => {
  return userSocketMap[userId];
};

const io = new Server(server);

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId as string;
  if (userId) {
    userSocketMap[userId] = socket.id;
    // join all group rooms this user belongs to
    Group.find({ members: userId }).then((groups) => {
      for (const group of groups) {
        socket.join(`group:${group._id}`);
      }
    });
  }

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("toggleReaction", async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
    const message = await Message.findById(messageId);
    if (!message) return;

    const idx = message.reactions.findIndex((r) => r.emoji === emoji && r.userId === userId);
    if (idx >= 0) {
      message.reactions.splice(idx, 1);
    } else {
      message.reactions.push({ emoji, userId });
    }
    await message.save();

    const payload = { messageId, reactions: message.reactions };
    const senderSocketId = getReceiverSocketId(String(message.senderId));
    const receiverSocketId = getReceiverSocketId(String(message.receiverId));
    if (senderSocketId) io.to(senderSocketId).emit("reactionUpdated", payload);
    if (receiverSocketId) io.to(receiverSocketId).emit("reactionUpdated", payload);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };
