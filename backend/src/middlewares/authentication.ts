import { Request } from "express";
import jwt from "jsonwebtoken";

import User from "@/models/user.model";
import { UserResponseDto } from "@/models/user.response.dto";
import { HttpStatus } from "@/types/HttpStatus";

interface JwtPayload {
  userId: string;
}

export class AuthenticationError extends Error {
  code: number;
  message: string;
  data: null;

  constructor(message: string) {
    super(message);
    this.code = HttpStatus.UNAUTHORIZED;
    this.message = message;
    this.data = null;
  }
}

export async function expressAuthentication(
  request: Request,
  securityName: string,
): Promise<Omit<UserResponseDto, "password">> {
  if (securityName === "jwt") {
    const token = request.cookies?.token;

    if (!token) {
      return Promise.reject(new AuthenticationError("No token provided"));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret",
      ) as JwtPayload;

      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return Promise.reject(new AuthenticationError("User not found"));
      }

      return user;
    } catch (error) {
      console.error("Error during token verification: ", error);
      return Promise.reject(new AuthenticationError("Invalid token"));
    }
  }

  return Promise.reject(new Error("Unknown security name"));
}
