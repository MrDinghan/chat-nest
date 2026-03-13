import { UserResponseDto } from "@shared/types";
import { Request as ExpressRequest } from "express";
import { Get, Request, Route, Security, Tags } from "tsoa";

import User from "@/models/user.model";

import { BaseController } from "./base-controller";

@Tags("User")
@Route("user")
export class UserController extends BaseController {
  @Security("jwt")
  @Get("list")
  public async getUserList(
    @Request() req: ExpressRequest,
  ): Promise<UserResponseDto[]> {
    const currentUserId = req.user!._id;
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("-password")
      .lean();
    return this.success(users);
  }
}
