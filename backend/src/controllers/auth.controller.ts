import bcrypt from "bcryptjs";
import { Request as ExpressRequest } from "express";
import { Body, Get, Post, Put, Request, Route, Security, Tags } from "tsoa";

import cloudinary from "@/lib/cloudinary";
import { generateToken } from "@/lib/utils";
import { IUserDTO } from "@/models/user.dto";
import User from "@/models/user.model";
import { UserResponseDto } from "@/models/user.response.dto";
import { HttpStatus } from "@/types/HttpStatus";

import { BaseController } from "./base-controller";

@Tags("Auth")
@Route("auth")
export class AuthController extends BaseController {
  @Post("signup")
  public async signup(
    @Body() body: IUserDTO,
    @Request() req: ExpressRequest,
  ): Promise<UserResponseDto> {
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
    const token = generateToken(newUser._id);
    if (req.res) {
      this.setTokenCookie(req.res, token);
    }
    await newUser.save();
    return this.success(newUser.toObject(), undefined, HttpStatus.CREATED);
  }

  @Post("login")
  public async login(
    @Body() body: Pick<IUserDTO, "email" | "password">,
    @Request() req: ExpressRequest,
  ): Promise<UserResponseDto> {
    const { email, password } = body;
    const user = await User.findOne({ email });
    if (!user) {
      return this.fail("User not found");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return this.fail("Invalid password");
    }
    const token = generateToken(user._id);
    if (req.res) {
      this.setTokenCookie(req.res, token);
    }
    return this.success(user.toObject());
  }

  @Post("logout")
  public async logout(@Request() req: ExpressRequest): Promise<null> {
    if (req.res) {
      req.res.cookie("token", "", { maxAge: 0 });
    }
    return this.success(null);
  }

  @Security("jwt")
  @Put("updateProfile")
  public async updateProfile(
    @Body() body: Partial<IUserDTO>,
    @Request() req: ExpressRequest,
  ): Promise<UserResponseDto> {
    const currentUser = req.user!;
    const userId = currentUser._id;
    const { profilePic } = body;

    if (!profilePic) {
      return this.fail("Profile pic is required", HttpStatus.BAD_REQUEST);
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true },
    );
    return this.success(updatedUser!.toObject());
  }

  @Security("jwt")
  @Get("checkAuth")
  public async checkAuth(): Promise<null> {
    return this.success(null);
  }
}
