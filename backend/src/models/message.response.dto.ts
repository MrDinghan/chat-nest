import { BaseDocumentDto } from "./base.response.dto";
import { IMessageDTO } from "./message.dto";

export interface ReactionDto {
  emoji: string;
  userId: string;
}

export interface MessageResponseDto extends BaseDocumentDto, IMessageDTO {
  isRead: boolean;
  reactions: ReactionDto[];
}
