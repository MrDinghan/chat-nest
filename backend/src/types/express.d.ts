import type { UserResponseDto } from "@shared/types";

declare global {
  namespace Express {
    interface Request {
      user?: UserResponseDto;
    }
  }
}
