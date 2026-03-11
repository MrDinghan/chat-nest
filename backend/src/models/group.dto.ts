import mongoose from "mongoose";

import { BaseDocumentDto } from "./base.response.dto";
import { IUserDTO } from "./user.dto";

export type GroupMemberDto = Pick<IUserDTO, "fullname" | "profilePic">;

export interface GroupDto extends BaseDocumentDto {
  name: string;
  avatar: string | undefined;
  ownerId: mongoose.Types.ObjectId;
  members: GroupMemberDto[];
}
