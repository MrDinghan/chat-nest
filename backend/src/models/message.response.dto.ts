import { BaseDocumentDto } from "./base.response.dto";
import { IMessageDTO } from "./message.dto";

export interface MessageResponseDto extends BaseDocumentDto, IMessageDTO {
  isRead: boolean;
}
