import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@shared/socket-events";
import type { UserResponseDto as OmitUserResponseDtoPassword } from "@shared/types";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import { create } from "zustand";

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface AuthState {
  authUser?: OmitUserResponseDtoPassword;
  setAuthUser: (user?: OmitUserResponseDtoPassword) => void;
  onlineUsers: string[];
  socket?: AppSocket;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser: void 0,
  setAuthUser: (user) => set({ authUser: user }),
  onlineUsers: [],
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket: AppSocket = io({
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket?.disconnect();
  },
}));

export default useAuthStore;
