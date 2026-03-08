import { Request as ExpressRequest } from "express";
import {
  FormField,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
  UploadedFile,
} from "tsoa";

import cloudinary from "@/lib/cloudinary";
import { getReceiverSocketId, io } from "@/lib/socket";
import Message from "@/models/message.model";
import { MessageResponseDto } from "@/models/message.response.dto";
import UnreadCount from "@/models/unreadCount.model";
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
    const lastMessages = await Message.aggregate([
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
      lastMessages.map((m) => [m._id.toString(), m.lastAt as Date]),
    );
    const lastMsgMap = new Map(
      lastMessages.map((m) => [
        m._id.toString(),
        {
          text: m.lastText as string | undefined,
          image: m.lastImage as string | undefined,
          createdAt: (m.lastAt as Date)?.toISOString(),
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
    const unreadCounts = await UnreadCount.find({ userId });
    const unreadMap = new Map(
      unreadCounts.map((u) => [u.senderId.toString(), u.count]),
    );
    const enrichedUsers = users.map((u) => ({
      ...u,
      lastMessage: lastMsgMap.get(u._id.toString()),
      unreadCount: unreadMap.get(u._id.toString()) ?? 0,
    }));
    return this.success(enrichedUsers as unknown as UserResponseDto[]);
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

    await UnreadCount.findOneAndUpdate(
      { userId: currentUserId, senderId: userToChatId },
      { $set: { count: 0 } },
    );

    return this.success(messages);
  }

  @Security("jwt")
  @Post("resetUnread/{id}")
  public async resetUnread(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ): Promise<null> {
    const currentUserId = req.user!._id;
    await UnreadCount.findOneAndUpdate(
      { userId: currentUserId, senderId: id },
      { $set: { count: 0 } },
    );
    return this.success(null);
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

    await UnreadCount.findOneAndUpdate(
      { userId: receiverId, senderId },
      { $inc: { count: 1 } },
      { upsert: true },
    );

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return this.success(newMessage.toObject(), void 0, HttpStatus.CREATED);
  }
}
