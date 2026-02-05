import { UserResponseDto } from "@/models/user.response.dto";

declare global {
  namespace Express {
    interface Request {
      user?: Omit<UserResponseDto, "password">;
    }
  }
}
