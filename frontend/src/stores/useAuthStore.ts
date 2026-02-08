import { create } from "zustand";

import type { OmitUserResponseDtoPassword } from "@/api/endpoints/chatNestAPI.schemas";

interface AuthState {
  authUser?: OmitUserResponseDtoPassword;
  setAuthUser: (user?: OmitUserResponseDtoPassword) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authUser: undefined,
  setAuthUser: (user) => set({ authUser: user }),
}));

export default useAuthStore;
