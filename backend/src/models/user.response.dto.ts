import { BaseDocumentDto } from "./base.response.dto";
import { IUserDTO } from "./user.dto";

export interface LastMessageDto {
  text: string | undefined;
  image: string | undefined;
  /**
   * Timestamp of the last message
   * @example "2023-10-01T12:00:00.000Z"
   */
  createdAt?: string | undefined;
}

export interface UserResponseDto
  extends BaseDocumentDto, Omit<IUserDTO, "password"> {
  lastMessage?: LastMessageDto | undefined;
  unreadCount?: number;
}
