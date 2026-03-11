import { IUserDTO } from "./user.dto";

export interface LastMessageDto {
  text: string | undefined;
  image: string | undefined;
  /**
   * Timestamp of the last message
   * @example "2023-10-01T12:00:00.000Z"
   */
  createdAt: Date | string | undefined;
}

export interface UserResponseDto extends Omit<IUserDTO, "password"> {}

export interface UserResponseDtoWithLastMessage extends UserResponseDto {
  lastMessage: LastMessageDto | undefined;
  unreadCount: number | undefined;
}
