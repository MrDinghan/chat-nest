import { io, Socket } from "socket.io-client";
import { create } from "zustand";

import type { OmitUserResponseDtoPassword } from "@/api/endpoints/chatNestAPI.schemas";

interface AuthState {
  authUser?: OmitUserResponseDtoPassword;
  setAuthUser: (user?: OmitUserResponseDtoPassword) => void;
  onlineUsers: string[];
  socket?: Socket;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser: undefined,
  setAuthUser: (user) => set({ authUser: user }),
  onlineUsers: [],
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io({
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket?.disconnect();
  },
}));

export default useAuthStore;
