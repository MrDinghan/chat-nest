import { IMessageDTO } from "./message.dto";
import { IUserDTO } from "./user.dto";

export interface MessageResponseDto extends IMessageDTO {}

export interface SearchMessageResultDto extends Pick<
  IMessageDTO,
  "text" | "senderId" | "receiverId"
> {
  otherUser: Pick<IUserDTO, "fullname" | "profilePic">;
}
