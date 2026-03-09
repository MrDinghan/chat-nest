import { BaseDocumentDto } from "./base.response.dto";
import { IMessageDTO } from "./message.dto";
import { UserResponseDto } from "./user.response.dto";

export interface ReactionDto {
  emoji: string;
  userId: string;
}

export interface MessageResponseDto extends BaseDocumentDto, IMessageDTO {
  isRead: boolean;
  reactions: ReactionDto[];
}

export interface SearchMessageResultDto extends BaseDocumentDto {
  text: string;
  senderId: string;
  receiverId: string;
  otherUser: UserResponseDto;
}
