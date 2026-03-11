import mongoose from "mongoose";

import { BaseDocumentDto } from "./base.response.dto";
import { ReactionDto } from "./message.dto";

export interface GroupMessageDto extends BaseDocumentDto {
  groupId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  text: string | undefined;
  image: string | undefined;
  reactions: ReactionDto[];
  readBy: mongoose.Types.ObjectId[];
}
