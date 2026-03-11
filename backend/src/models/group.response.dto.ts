import { GroupDto } from "./group.dto";

export interface GroupLastMessageDto {
  text: string | undefined;
  image: string | undefined;
  createdAt: Date | string | undefined;
  senderName: string | undefined;
}

export interface GroupResponseDto extends GroupDto {
  lastMessage: GroupLastMessageDto | undefined;
  unreadCount?: number;
}
