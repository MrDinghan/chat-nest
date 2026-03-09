import { Request as ExpressRequest } from "express";
import {
  Body,
  FormField,
  Get,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
  UploadedFile,
} from "tsoa";

import cloudinary from "@/lib/cloudinary";
import { getReceiverSocketId, io } from "@/lib/socket";
import Message from "@/models/message.model";
import {
  MessageResponseDto,
  SearchMessageResultDto,
} from "@/models/message.response.dto";
import User from "@/models/user.model";
import { UserResponseDto } from "@/models/user.response.dto";
import { HttpStatus } from "@/types/HttpStatus";

import { BaseController } from "./base-controller";

@Tags("Message")
@Route("message")
export class MessageController extends BaseController {
  @Security("jwt")
  @Get("getUsersListWithoutCurrentUser")
  public async getUsersList(
    @Request() req: ExpressRequest,
  ): Promise<UserResponseDto[]> {
    const currentUser = req.user!;
    const userId = currentUser._id;

    // find the most recent message for each conversation
    const lastMessages = await Message.aggregate<{
      _id: string;
      lastAt: Date | undefined;
      lastText: string | undefined;
      lastImage: string | undefined;
    }>([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"],
          },
          lastAt: { $first: "$createdAt" },
          lastText: { $first: "$text" },
          lastImage: { $first: "$image" },
        },
      },
    ]);

    // fetch users, sort by last message time, attach lastMessage preview
    const timeMap = new Map(
      lastMessages.map((m) => [m._id.toString(), m.lastAt]),
    );
    const lastMsgMap = new Map(
      lastMessages.map((m) => [
        m._id.toString(),
        {
          text: m.lastText,
          image: m.lastImage,
          createdAt: m.lastAt?.toISOString(),
        },
      ]),
    );
    const users = await User.find({ _id: { $ne: userId } })
      .select("-password")
      .lean();
    users.sort((a, b) => {
      const ta = timeMap.get(a._id.toString())?.getTime() ?? 0;
      const tb = timeMap.get(b._id.toString())?.getTime() ?? 0;
      return tb - ta;
    });
    const unreadAgg = await Message.aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: { receiverId: userId, isRead: { $ne: true } } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } },
    ]);
    const unreadMap = new Map(
      unreadAgg.map((u) => [u._id.toString(), u.count]),
    );
    const enrichedUsers = users.map((u) => ({
      ...u,
      lastMessage: lastMsgMap.get(u._id.toString()),
      unreadCount: unreadMap.get(u._id.toString()) ?? 0,
    }));
    return this.success(enrichedUsers);
  }

  @Security("jwt")
  @Get("getMessages/{id}")
  public async getMessages(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ): Promise<MessageResponseDto[]> {
    const currentUser = req.user!;
    const currentUserId = currentUser._id;
    const userToChatId = id;
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    return this.success(messages);
  }

  @Security("jwt")
  @Post("markRead")
  public async markRead(
    @Body() body: { messageIds: string[] },
    @Request() req: ExpressRequest,
  ): Promise<null> {
    const currentUserId = req.user!._id;
    const { messageIds } = body;

    const toUpdate = await Message.find({
      _id: { $in: messageIds },
      receiverId: currentUserId,
      isRead: { $ne: true },
    }).select("senderId");

    if (toUpdate.length === 0) return this.success(null);

    await Message.updateMany(
      { _id: { $in: toUpdate.map((m) => m._id) } },
      { $set: { isRead: true } },
    );

    const senderIds = [...new Set(toUpdate.map((m) => m.senderId.toString()))];
    for (const senderId of senderIds) {
      const socketId = getReceiverSocketId(senderId);
      if (socketId) {
        io.to(socketId).emit("messagesRead", {
          messageIds: toUpdate
            .filter((m) => m.senderId.toString() === senderId)
            .map((m) => m._id.toString()),
        });
      }
    }

    return this.success(null);
  }

  @Security("jwt")
  @Get("search")
  public async search(
    @Query("q") q: string,
    @Request() req: ExpressRequest,
  ): Promise<SearchMessageResultDto[]> {
    const currentUserId = req.user!._id;

    const results = await Message.aggregate<SearchMessageResultDto>([
      {
        $match: {
          $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
          text: { $regex: q, $options: "i" },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 20 },
      {
        $addFields: {
          otherUserId: {
            $cond: [
              { $eq: ["$senderId", currentUserId] },
              "$receiverId",
              "$senderId",
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "otherUserId",
          foreignField: "_id",
          as: "otherUserArr",
          pipeline: [{ $project: { _id: 1, fullname: 1, profilePic: 1 } }],
        },
      },
      {
        $addFields: {
          otherUser: { $arrayElemAt: ["$otherUserArr", 0] },
        },
      },
      {
        $project: {
          otherUserArr: 0,
          otherUserId: 0,
        },
      },
    ]);

    return this.success(results);
  }

  @Security("jwt")
  @Post("postMessage/{id}")
  public async postMessage(
    @Path() id: string,
    @Request() req: ExpressRequest,
    @FormField() text?: string,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<MessageResponseDto> {
    const receiverId = id;
    const senderId = req.user!._id;
    if (!text && !image) {
      return this.fail("Message must contain text or image");
    }
    let imageUrl: string | undefined;
    if (image) {
      const uploadResponse = await new Promise<{ secure_url: string }>(
        (resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "image" },
            (error, result) => {
              if (error || !result) return reject(error);
              resolve(result);
            },
          );
          stream.end(image.buffer);
        },
      );
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = new Message({
      senderId: senderId,
      receiverId: receiverId,
      text,
      image: imageUrl,
    });
    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return this.success(newMessage.toObject(), void 0, HttpStatus.CREATED);
  }
}
