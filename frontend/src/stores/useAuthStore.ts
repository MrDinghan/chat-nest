import { create } from "zustand";

import type { OmitUserResponseDtoPassword } from "@/api/endpoints/chatNestAPI.schemas";

interface AuthState {
  authUser?: OmitUserResponseDtoPassword;
  setAuthUser: (user?: OmitUserResponseDtoPassword) => void;
  onlineUsers: string[];
}

export const useAuthStore = create<AuthState>((set) => ({
  authUser: undefined,
  setAuthUser: (user) => set({ authUser: user }),
  onlineUsers: [],
}));

export default useAuthStore;
