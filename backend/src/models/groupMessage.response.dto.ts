import { GroupMemberDto } from "./group.dto";
import { GroupMessageDto } from "./groupMessage.dto";

export interface GroupMessageResponseDto extends GroupMessageDto {
  sender: GroupMemberDto;
}
