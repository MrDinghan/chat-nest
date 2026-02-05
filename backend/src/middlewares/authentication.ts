import { Request } from "express";
import jwt from "jsonwebtoken";

import User from "@/models/user.model";
import { UserResponseDto } from "@/models/user.response.dto";

interface JwtPayload {
  userId: string;
}

export async function expressAuthentication(
  request: Request,
  securityName: string,
): Promise<Omit<UserResponseDto, "password">> {
  if (securityName === "jwt") {
    const token = request.cookies?.token;

    if (!token) {
      return Promise.reject(new Error("No token provided"));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret",
      ) as JwtPayload;

      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return Promise.reject(new Error("User not found"));
      }

      return user;
    } catch (error) {
      console.error("Error during token verification: ", error);
      return Promise.reject(new Error("Invalid token"));
    }
  }

  return Promise.reject(new Error("Unknown security name"));
}
