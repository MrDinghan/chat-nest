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

import Message from "@/models/message.model";
import { MessageResponseDto } from "@/models/message.response.dto";
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
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password",
    );
    return this.success(filteredUsers);
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
    return this.success(newMessage.toObject(), undefined, HttpStatus.CREATED);
  }
}
