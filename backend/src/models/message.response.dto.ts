import { IMessageDTO } from "./message.dto";
import { UserResponseDto } from "./user.response.dto";

export interface MessageResponseDto extends IMessageDTO {}

export interface SearchMessageResultDto extends Pick<
  IMessageDTO,
  "text" | "senderId" | "receiverId" | "_id" | "createdAt"
> {
  otherUser: UserResponseDto;
}
