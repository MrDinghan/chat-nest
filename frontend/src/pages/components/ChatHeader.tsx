import { ArrowLeft, X } from "lucide-react";
import type { FC } from "react";

import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";

const ChatHeader: FC = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <img
              src={selectedUser?.profilePic || "/avatar.png"}
              alt={selectedUser?.fullname}
              className="size-10 rounded-full object-cover"
            />
            {onlineUsers.includes(selectedUser?._id ?? "") && (
              <span className="absolute bottom-0 right-0 size-2 bg-green-500 rounded-full ring-2 ring-zinc-900" />
            )}
          </div>

          {/* User info */}
          <h3 className="font-medium">{selectedUser?.fullname}</h3>
        </div>

        {/* Close/back button */}
        <button onClick={() => setSelectedUser(void 0)}>
          <ArrowLeft className="lg:hidden" />
          <X className="hidden lg:block" />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
