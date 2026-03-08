import { BaseDocumentDto } from "./base.response.dto";
import { IUserDTO } from "./user.dto";

export interface LastMessageDto {
  text?: string;
  image?: string;
  /**
   * Timestamp of the last message
   * @example "2023-10-01T12:00:00.000Z"
   */
  createdAt?: string;
}

export interface UserResponseDto extends BaseDocumentDto, IUserDTO {
  lastMessage?: LastMessageDto;
  unreadCount?: number;
}
