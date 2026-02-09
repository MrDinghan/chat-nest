import { create } from "zustand";

import type { OmitUserResponseDtoPassword } from "@/api/endpoints/chatNestAPI.schemas";

interface ChatState {
  selectedUser?: OmitUserResponseDtoPassword;
  setSelectedUser: (user?: OmitUserResponseDtoPassword) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  selectedUser: undefined,
  setSelectedUser: (user) => set({ selectedUser: user }),
}));
