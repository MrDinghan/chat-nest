import { IUserDTO } from "@/models/user.dto";

declare global {
  namespace Express {
    interface Request {
      user?: Omit<IUserDTO, "password">;
    }
  }
}
