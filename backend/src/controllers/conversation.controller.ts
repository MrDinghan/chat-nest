import {
  ConversationLastMessageDto,
  ConversationResponseDto,
  CreateGroupRequest,
  FindOrCreateDmRequest,
  MessageResponseDto,
  SearchMessageResultDto,
  UserSummaryDto,
} from "@shared/types";
import { Request as ExpressRequest } from "express";
import mongoose from "mongoose";
import {
  Body,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Query,
  Request,
  Route,
  Security,
  Tags,
  UploadedFile,
} from "tsoa";

import cloudinary from "@/lib/cloudinary";
import { getReceiverSocketId, io } from "@/lib/socket";
import Conversation from "@/models/conversation.model";
import Message from "@/models/message.model";
import User from "@/models/user.model";
import { HttpStatus } from "@/types/HttpStatus";

import { BaseController } from "./base-controller";

// senderId is populated, so it becomes UserSummaryDto object
type PopulatedMsgLean = Omit<MessageResponseDto, "senderId"> & {
  senderId: UserSummaryDto;
};

function toMsgDto(m: PopulatedMsgLean): MessageResponseDto {
  return { ...m, senderId: m.senderId._id, sender: m.senderId };
}

interface UploadImageResponse {
  imageUrl: string;
}

@Tags("Conversation")
@Route("conversation")
export class ConversationController extends BaseController {
  @Security("jwt")
  @Get("list")
  public async getConversationList(
    @Request() req: ExpressRequest,
  ): Promise<ConversationResponseDto[]> {
    const userId = req.user!._id;

    const conversations = await Conversation.find({ members: userId })
      .populate("members", "fullname profilePic _id")
      .lean<ConversationResponseDto[]>();

    const convIds = conversations.map((c) => c._id);

    // Last message per conversation
    const lastMessages = await Message.aggregate<{
      _id: mongoose.Types.ObjectId;
      lastText?: string;
      lastImage?: string;
      lastAt?: Date;
      lastSenderId?: mongoose.Types.ObjectId;
    }>([
      { $match: { conversationId: { $in: convIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          lastText: { $first: "$text" },
          lastImage: { $first: "$image" },
          lastAt: { $first: "$createdAt" },
          lastSenderId: { $first: "$senderId" },
        },
      },
    ]);

    // Sender names for last messages
    const senderIds = [
      ...new Set(
        lastMessages.flatMap((m) =>
          m.lastSenderId ? [m.lastSenderId.toString()] : [],
        ),
      ),
    ];
    const senders = await User.find({ _id: { $in: senderIds } })
      .select("fullname")
      .lean<{ _id: mongoose.Types.ObjectId; fullname: string }[]>();
    const senderMap = new Map(
      senders.map((s) => [s._id.toString(), s.fullname]),
    );

    const lastMsgMap = new Map(
      lastMessages.map((m) => [
        m._id.toString(),
        {
          text: m.lastText,
          image: m.lastImage,
          createdAt: m.lastAt?.toISOString(),
          senderName: m.lastSenderId
            ? senderMap.get(m.lastSenderId.toString())
            : void 0,
        } satisfies ConversationLastMessageDto,
      ]),
    );

    // Unread counts
    const unreadAgg = await Message.aggregate<{
      _id: mongoose.Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          conversationId: { $in: convIds },
          senderId: { $ne: userId },
          readBy: { $ne: userId },
        },
      },
      { $group: { _id: "$conversationId", count: { $sum: 1 } } },
    ]);
    const unreadMap = new Map(
      unreadAgg.map((u) => [u._id.toString(), u.count]),
    );

    const enriched: ConversationResponseDto[] = conversations.map((conv) => ({
      ...conv,
      lastMessage: lastMsgMap.get(conv._id.toString()),
      unreadCount: unreadMap.get(conv._id.toString()) ?? 0,
    }));

    return this.success(enriched);
  }

  @Security("jwt")
  @Post("dm")
  public async findOrCreateDm(
    @Body() body: FindOrCreateDmRequest,
    @Request() req: ExpressRequest,
  ): Promise<ConversationResponseDto> {
    const userId = req.user!._id;
    const { memberId } = body;

    const existing = await Conversation.findOne({
      type: "dm",
      members: { $all: [userId, memberId], $size: 2 },
    })
      .populate("members", "fullname profilePic _id")
      .lean<ConversationResponseDto>();

    if (existing) {
      const userSocketId = getReceiverSocketId(userId.toString());
      const memberSocketId = getReceiverSocketId(memberId);
      if (userSocketId)
        io.sockets.sockets.get(userSocketId)?.join(`conv:${existing._id}`);
      if (memberSocketId)
        io.sockets.sockets.get(memberSocketId)?.join(`conv:${existing._id}`);

      return this.success(existing);
    }

    const conv = new Conversation({
      type: "dm",
      members: [userId, memberId],
    });
    await conv.save();

    const populated = await Conversation.findById(conv._id)
      .populate("members", "fullname profilePic _id")
      .lean<ConversationResponseDto>();

    if (!populated) return this.fail("Failed to create conversation");

    const userSocketId = getReceiverSocketId(userId.toString());
    const memberSocketId = getReceiverSocketId(memberId);
    if (userSocketId)
      io.sockets.sockets.get(userSocketId)?.join(`conv:${conv._id}`);
    if (memberSocketId)
      io.sockets.sockets.get(memberSocketId)?.join(`conv:${conv._id}`);

    if (memberSocketId) {
      io.to(memberSocketId).emit("conversationCreated", populated);
    }

    return this.success(populated, void 0, HttpStatus.CREATED);
  }

  @Security("jwt")
  @Post("group")
  public async createGroup(
    @Body() body: CreateGroupRequest,
    @Request() req: ExpressRequest,
  ): Promise<ConversationResponseDto> {
    const userId = req.user!._id;
    const { name, memberIds } = body;

    const allMembers = [...new Set([userId.toString(), ...memberIds])];

    const conv = new Conversation({
      type: "group",
      name,
      ownerId: userId,
      members: allMembers,
    });
    await conv.save();

    const populated = await Conversation.findById(conv._id)
      .populate("members", "fullname profilePic _id")
      .lean<ConversationResponseDto>();

    if (!populated) return this.fail("Group creation failed");

    for (const memberId of allMembers) {
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        io.sockets.sockets.get(socketId)?.join(`conv:${conv._id}`);
      }
    }

    io.to(`conv:${conv._id}`).emit("conversationCreated", populated);

    return this.success(populated, void 0, HttpStatus.CREATED);
  }

  @Security("jwt")
  @Delete("{id}")
  public async dissolveConversation(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ): Promise<null> {
    const userId = req.user!._id;

    const conv = await Conversation.findById(id);
    if (!conv) return this.fail("Conversation not found", HttpStatus.NOT_FOUND);
    if (conv.type !== "group")
      return this.fail("Only groups can be dissolved", HttpStatus.BAD_REQUEST);
    if (conv.ownerId?.toString() !== userId.toString()) {
      return this.fail(
        "Only the group owner can dissolve the group",
        HttpStatus.FORBIDDEN,
      );
    }

    await Message.deleteMany({ conversationId: id });
    await Conversation.findByIdAndDelete(id);

    io.to(`conv:${id}`).emit("conversationDissolved", { conversationId: id });

    return this.success(null);
  }

  @Security("jwt")
  @Put("{id}/avatar")
  public async updateGroupAvatar(
    @Path() id: string,
    @Request() req: ExpressRequest,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<ConversationResponseDto> {
    const userId = req.user!._id;

    const conv = await Conversation.findById(id);
    if (!conv) return this.fail("Conversation not found", HttpStatus.NOT_FOUND);
    if (conv.type !== "group")
      return this.fail("Only groups have avatars", HttpStatus.BAD_REQUEST);
    if (conv.ownerId?.toString() !== userId.toString()) {
      return this.fail(
        "Only the group owner can update the avatar",
        HttpStatus.FORBIDDEN,
      );
    }

    if (!image) return this.fail("Image is required");

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

    conv.avatar = uploadResponse.secure_url;
    await conv.save();

    const populated = await Conversation.findById(id)
      .populate("members", "fullname profilePic _id")
      .lean<ConversationResponseDto>();

    if (!populated)
      return this.fail("Conversation not found", HttpStatus.NOT_FOUND);

    io.to(`conv:${id}`).emit("conversationUpdated", populated);

    return this.success(populated);
  }

  @Security("jwt")
  @Get("{id}/messages")
  public async getMessages(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ): Promise<MessageResponseDto[]> {
    const userId = req.user!._id;

    const conv = await Conversation.findById(id);
    if (!conv) return this.fail("Conversation not found", HttpStatus.NOT_FOUND);
    if (!conv.members.some((m) => m.toString() === userId.toString())) {
      return this.fail(
        "You are not a member of this conversation",
        HttpStatus.FORBIDDEN,
      );
    }

    const messages = await Message.find({ conversationId: id })
      .populate("senderId", "fullname profilePic _id")
      .sort({ createdAt: 1 })
      .lean<PopulatedMsgLean[]>();

    return this.success(messages.map(toMsgDto));
  }

  @Security("jwt")
  @Post("upload-image")
  public async uploadImage(
    @Request() _req: ExpressRequest,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<UploadImageResponse> {
    if (!image) return this.fail("Image file is required");

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

    return this.success({ imageUrl: uploadResponse.secure_url });
  }

  @Security("jwt")
  @Get("search")
  public async search(
    @Query("q") q: string,
    @Request() req: ExpressRequest,
  ): Promise<SearchMessageResultDto[]> {
    const userId = req.user!._id;

    const userConvs = await Conversation.find({ members: userId })
      .select("_id type name members")
      .lean<
        {
          _id: mongoose.Types.ObjectId;
          type: "dm" | "group";
          name?: string;
          members: mongoose.Types.ObjectId[];
        }[]
      >();

    const convIds = userConvs.map((c) => c._id);
    const convMap = new Map(userConvs.map((c) => [c._id.toString(), c]));

    const messages = await Message.find({
      conversationId: { $in: convIds },
      text: { $regex: q, $options: "i" },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean<
        {
          _id: mongoose.Types.ObjectId;
          conversationId: mongoose.Types.ObjectId;
          senderId: mongoose.Types.ObjectId;
          text?: string;
          createdAt: Date;
        }[]
      >();

    const neededUserIds = new Set<string>();
    for (const msg of messages) {
      neededUserIds.add(msg.senderId.toString());
      const conv = convMap.get(msg.conversationId.toString());
      if (conv?.type === "dm") {
        const otherId = conv.members
          .find((m) => m.toString() !== userId.toString())
          ?.toString();
        if (otherId) neededUserIds.add(otherId);
      }
    }

    const userDocs = await User.find({ _id: { $in: [...neededUserIds] } })
      .select("fullname profilePic")
      .lean<
        {
          _id: mongoose.Types.ObjectId;
          fullname: string;
          profilePic?: string;
        }[]
      >();
    const userMap = new Map(userDocs.map((u) => [u._id.toString(), u]));

    const results: SearchMessageResultDto[] = messages.map((msg) => {
      const conv = convMap.get(msg.conversationId.toString());
      const isDm = conv?.type === "dm";
      const sender = userMap.get(msg.senderId.toString());

      const otherMemberId = isDm
        ? conv?.members
            .find((m) => m.toString() !== userId.toString())
            ?.toString()
        : void 0;
      const otherUserDoc = otherMemberId ? userMap.get(otherMemberId) : void 0;

      const otherUser: UserSummaryDto | undefined =
        otherMemberId && otherUserDoc
          ? {
              _id: otherMemberId,
              fullname: otherUserDoc.fullname,
              profilePic: otherUserDoc.profilePic,
            }
          : void 0;

      return {
        _id: msg._id.toString(),
        text: msg.text,
        senderId: msg.senderId.toString(),
        conversationId: msg.conversationId.toString(),
        createdAt: msg.createdAt.toISOString(),
        conversationType: conv?.type ?? "dm",
        conversationName: !isDm ? conv?.name : void 0,
        senderName: sender?.fullname,
        otherUser,
      } satisfies SearchMessageResultDto;
    });

    return this.success(results);
  }
}
