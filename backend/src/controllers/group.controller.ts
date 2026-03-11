import { Request as ExpressRequest } from "express";
import mongoose from "mongoose";
import {
  Body,
  Delete,
  FormField,
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
import { GroupMemberDto } from "@/models/group.dto";
import Group from "@/models/group.model";
import { GroupResponseDto } from "@/models/group.response.dto";
import GroupMessage from "@/models/groupMessage.model";
import { GroupMessageResponseDto } from "@/models/groupMessage.response.dto";
import User from "@/models/user.model";
import { HttpStatus } from "@/types/HttpStatus";

import { BaseController } from "./base-controller";

interface CreateGroupBody {
  name: string;
  memberIds: string[];
}

interface SearchGroupMessageResultDto {
  /** MongoDB Object ID */
  _id: string;
  /** Message content */
  text?: string;
  /** Sender's user ID */
  senderId: string;
  /** Group ID */
  groupId: string;
  /** Group name */
  groupName: string;
  /** Sender's full name */
  senderName: string;
  createdAt: Date | string;
}

@Tags("Group")
@Route("group")
export class GroupController extends BaseController {
  @Security("jwt")
  @Get("list")
  public async getGroupList(
    @Request() req: ExpressRequest,
  ): Promise<GroupResponseDto[]> {
    const userId = req.user!._id;

    const groups = (await Group.find({ members: userId })
      .populate("members", "fullname profilePic")
      .lean()) as unknown as GroupResponseDto[];

    // get lastMessage for each group
    const groupIds = groups.map((g) => g._id);
    const lastMessages = await GroupMessage.aggregate<{
      _id: string;
      lastText?: string;
      lastImage?: string;
      lastAt?: Date;
      lastSenderId?: string;
    }>([
      { $match: { groupId: { $in: groupIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$groupId",
          lastText: { $first: "$text" },
          lastImage: { $first: "$image" },
          lastAt: { $first: "$createdAt" },
          lastSenderId: { $first: "$senderId" },
        },
      },
    ]);

    // get sender names
    const senderIds = [
      ...new Set(
        lastMessages.map((m) => m.lastSenderId?.toString()).filter(Boolean),
      ),
    ];
    const senders = await User.find({ _id: { $in: senderIds } })
      .select("fullname")
      .lean();
    const senderMap = new Map(
      senders.map((s) => [s._id.toString(), s.fullname]),
    );

    const lastMsgMap = new Map(
      lastMessages.map((m) => [
        m._id.toString(),
        {
          text: m.lastText,
          image: m.lastImage,
          createdAt: m.lastAt,
          senderName: senderMap.get(m.lastSenderId?.toString() ?? ""),
        },
      ]),
    );

    // count unread messages per group (sent by others, not yet in readBy)
    const unreadAgg = await GroupMessage.aggregate<{
      _id: string;
      count: number;
    }>([
      {
        $match: {
          groupId: { $in: groupIds },
          senderId: { $ne: userId },
          readBy: { $ne: userId },
        },
      },
      { $group: { _id: "$groupId", count: { $sum: 1 } } },
    ]);
    const unreadMap = new Map(
      unreadAgg.map((u) => [u._id.toString(), u.count]),
    );

    const enriched = groups.map((g) => {
      const lm = lastMsgMap.get(g._id.toString());
      return {
        ...g,
        lastMessage: lm,
        unreadCount: unreadMap.get(g._id.toString()) ?? 0,
      };
    });

    return this.success(enriched);
  }

  @Security("jwt")
  @Post("create")
  public async createGroup(
    @Body() body: CreateGroupBody,
    @Request() req: ExpressRequest,
  ): Promise<GroupResponseDto> {
    const userId = req.user!._id;
    const { name, memberIds } = body;

    const allMembers = [...new Set([userId.toString(), ...memberIds])];

    const group = new Group({
      name,
      ownerId: userId,
      members: allMembers,
    });
    await group.save();

    const populated = (await Group.findById(group._id)
      .populate("members", "fullname profilePic")
      .lean()) as unknown as GroupResponseDto;

    if (!populated) return this.fail("Group creation failed");

    // let all online members join the group socket room
    for (const memberId of allMembers) {
      const socketId = getReceiverSocketId(memberId);
      if (socketId) {
        const memberSocket = io.sockets.sockets.get(socketId);
        memberSocket?.join(`group:${group._id}`);
      }
    }

    // notify all online members of the new group
    io.to(`group:${group._id}`).emit("groupCreated", populated);

    return this.success(populated, void 0, HttpStatus.CREATED);
  }

  @Security("jwt")
  @Delete("{id}/dissolve")
  public async dissolveGroup(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ): Promise<null> {
    const userId = req.user!._id;

    const group = await Group.findById(id);
    if (!group) return this.fail("Group not found", HttpStatus.NOT_FOUND);
    if (group.ownerId.toString() !== userId.toString()) {
      return this.fail(
        "Only the group owner can dissolve the group",
        HttpStatus.FORBIDDEN,
      );
    }

    await GroupMessage.deleteMany({ groupId: id });
    await Group.findByIdAndDelete(id);

    io.to(`group:${id}`).emit("groupDissolved", { groupId: id });

    return this.success(null);
  }

  @Security("jwt")
  @Put("{id}/avatar")
  public async updateGroupAvatar(
    @Path() id: string,
    @Request() req: ExpressRequest,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<GroupResponseDto> {
    const userId = req.user!._id;

    const group = await Group.findById(id);
    if (!group) return this.fail("Group not found", HttpStatus.NOT_FOUND);
    if (group.ownerId.toString() !== userId.toString()) {
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

    group.avatar = uploadResponse.secure_url;
    await group.save();

    const populated = (await Group.findById(id)
      .populate("members", "fullname profilePic")
      .lean()) as unknown as GroupResponseDto;

    io.to(`group:${id}`).emit("groupUpdated", populated);

    return this.success(populated);
  }

  @Security("jwt")
  @Get("{id}/messages")
  public async getGroupMessages(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ): Promise<GroupMessageResponseDto[]> {
    const userId = req.user!._id;

    const group = await Group.findById(id);
    if (!group) return this.fail("Group not found", HttpStatus.NOT_FOUND);
    if (!group.members.some((m) => m.toString() === userId.toString())) {
      return this.fail(
        "You are not a member of this group",
        HttpStatus.FORBIDDEN,
      );
    }

    const messages = await GroupMessage.find({ groupId: id })
      .populate("senderId", "fullname profilePic")
      .sort({ createdAt: 1 })
      .lean();

    return this.success(
      messages.map((msg) => ({
        ...msg,
        _id: msg._id.toString(),
        senderId: msg.senderId._id,
        sender: msg.senderId as unknown as GroupMemberDto,
      })),
    );
  }

  @Security("jwt")
  @Post("{groupId}/messages/markRead")
  public async markGroupMessagesRead(
    @Path() groupId: string,
    @Body() body: { messageIds: string[] },
    @Request() req: ExpressRequest,
  ): Promise<null> {
    const userId = req.user!._id;
    const { messageIds } = body;

    await GroupMessage.updateMany(
      {
        _id: { $in: messageIds },
        groupId,
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId } },
    );

    io.to(`group:${groupId}`).emit("groupMessagesRead", {
      messageIds,
      readerId: userId.toString(),
    });

    return this.success(null);
  }

  @Security("jwt")
  @Get("messages/search")
  public async searchGroupMessages(
    @Query("q") q: string,
    @Request() req: ExpressRequest,
  ): Promise<SearchGroupMessageResultDto[]> {
    const userId = req.user!._id;

    // Find all groups the user belongs to
    const userGroups = await Group.find({ members: userId })
      .select("_id name")
      .lean();
    const groupIds = userGroups.map((g) => g._id);
    const groupNameMap = new Map(
      userGroups.map((g) => [g._id.toString(), g.name]),
    );

    const results = await GroupMessage.aggregate<{
      _id: string;
      text: string;
      senderId: string;
      groupId: string;
      createdAt: Date;
      senderFullname: string;
    }>([
      {
        $match: {
          groupId: { $in: groupIds },
          text: { $regex: q, $options: "i" },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "users",
          localField: "senderId",
          foreignField: "_id",
          as: "senderArr",
          pipeline: [{ $project: { _id: 0, fullname: 1 } }],
        },
      },
      {
        $addFields: {
          senderFullname: { $arrayElemAt: ["$senderArr.fullname", 0] },
        },
      },
      {
        $project: {
          senderArr: 0,
        },
      },
    ]);

    return this.success(
      results.map((r) => ({
        _id: r._id.toString(),
        text: r.text,
        senderId: r.senderId.toString(),
        groupId: r.groupId.toString(),
        groupName: groupNameMap.get(r.groupId.toString()) ?? "",
        senderName: r.senderFullname ?? "",
        createdAt: r.createdAt,
      })),
    );
  }

  @Security("jwt")
  @Post("{groupId}/message")
  public async sendGroupMessage(
    @Path() groupId: string,
    @Request() req: ExpressRequest,
    @FormField() text?: string,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<GroupMessageResponseDto> {
    const userId = req.user!._id as unknown as mongoose.Types.ObjectId;
    const id = groupId as unknown as mongoose.Types.ObjectId;

    const group = await Group.findById(id);
    if (!group) return this.fail("Group not found", HttpStatus.NOT_FOUND);
    if (!group.members.some((m) => m.toString() === userId.toString())) {
      return this.fail(
        "You are not a member of this group",
        HttpStatus.FORBIDDEN,
      );
    }

    if (!text && !image) return this.fail("Message must contain text or image");

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

    const newMessage = new GroupMessage({
      groupId: id,
      senderId: userId,
      text,
      image: imageUrl,
      reactions: [],
      readBy: [],
    });
    await newMessage.save();

    const sender = await User.findById(userId)
      .select("fullname profilePic")
      .lean();

    const result: GroupMessageResponseDto = {
      _id: newMessage._id,
      groupId: id,
      senderId: userId,
      text: newMessage.text,
      image: newMessage.image,
      sender: sender!,
      reactions: [],
      readBy: [],
      createdAt: newMessage.createdAt,
      updatedAt: newMessage.updatedAt,
    };

    // Emit to all group members EXCEPT the sender (sender uses optimistic update)
    const senderSocketId = getReceiverSocketId(userId.toString());
    const emitter = senderSocketId
      ? io.to(`group:${id}`).except(senderSocketId)
      : io.to(`group:${id}`);
    emitter.emit("newGroupMessage", result);

    return this.success(result, void 0, HttpStatus.CREATED);
  }
}
