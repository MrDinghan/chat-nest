import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Body, Post, Route, Tags } from "tsoa";

import { IUserDTO } from "@/models/user.dto";
import User from "@/models/user.model";
import { UserResponseDto, userTransformer } from "@/models/user.response.dto";
import { ApiResponse } from "@/types/ApiResponse";

import { BaseController } from "./base-controller";

@Route("auth")
@Tags("Auth")
export class AuthController extends BaseController {
  @Post("signup")
  public async signup(
    @Body() body: IUserDTO
  ): Promise<ApiResponse<UserResponseDto>> {
    const { email, fullname, password, profilePic } = body;
    if (password.length < 6) {
      return this.fail("Password must be at least 6 characters long");
    }
    if (!email || !fullname) {
      return this.fail("Email and fullname are required");
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return this.fail("User already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      fullname,
      profilePic,
      password: hashedPassword,
    });
    if (!newUser) {
      return this.fail("Failed to create user");
    }
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET || "secret",
      {
        expiresIn: "7d",
      }
    );
    this.setHeader(
      "Set-Cookie",
      `token=${token}; HttpOnly; Path=/; Max-Age=${
        7 * 24 * 60 * 60
      }; SameSite=Strict; Secure=${process.env.NODE_ENV === "production"}`
    );
    await newUser.save();
    return this.successWithTransformOne(
      newUser,
      userTransformer,
      "Signup successful"
    );
  }
}
