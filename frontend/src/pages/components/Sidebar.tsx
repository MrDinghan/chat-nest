import { SquarePen } from "lucide-react";
import { type FC, useEffect, useState } from "react";

import {
  getGetGroupListQueryKey,
  useGetGroupList,
} from "@/api/endpoints/group";
import {
  getGetUsersListQueryKey,
  useGetUsersList,
} from "@/api/endpoints/message";
import { queryClient } from "@/lib/queryClient";
import { formatChatTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";

import CreateGroupModal from "./CreateGroupModal";
import SearchBar from "./SearchBar";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";

const Sidebar: FC = () => {
  const { selectedUser, setSelectedUser, selectedGroup, setSelectedGroup } = useChatStore();
  const { onlineUsers, socket } = useAuthStore();
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: getGetUsersListQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetGroupListQueryKey() });
    };
    socket.on("newMessage", handler);
    socket.on("newGroupMessage", handler);
    socket.on("groupCreated", handler);
    return () => {
      socket.off("newMessage", handler);
      socket.off("newGroupMessage", handler);
      socket.off("groupCreated", handler);
    };
  }, [socket]);

  const { data: users, isLoading: isUsersLoading } = useGetUsersList();
  const { data: groups, isLoading: isGroupsLoading } = useGetGroupList();

  if (isUsersLoading || isGroupsLoading) return <SidebarSkeleton />;

  // merge dm and group conversations, sorted by last message time
  type ConvItem =
    | { type: "dm"; id: string; lastAt: number; data: NonNullable<typeof users>[number] }
    | { type: "group"; id: string; lastAt: number; data: NonNullable<typeof groups>[number] };

  const dmItems: ConvItem[] = (users ?? []).map((u) => ({
    type: "dm",
    id: u._id,
    lastAt: u.lastMessage?.createdAt ? new Date(u.lastMessage.createdAt).getTime() : 0,
    data: u,
  }));

  const groupItems: ConvItem[] = (groups ?? []).map((g) => ({
    type: "group",
    id: g._id,
    lastAt: g.lastMessage?.createdAt
      ? new Date(g.lastMessage.createdAt).getTime()
      : new Date(g.createdAt).getTime(),
    data: g,
  }));

  const conversations: ConvItem[] = [...dmItems, ...groupItems].sort((a, b) => b.lastAt - a.lastAt);

  return (
    <>
      <aside className="h-full w-full lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
        <div className="border-b border-base-300 w-full p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-lg">Chats</span>
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => setShowCreateGroup(true)}
              title="Create group"
            >
              <SquarePen className="size-5" />
            </button>
          </div>
        </div>

        {/* Mobile search bar, hidden on PC */}
        <div className="px-3 pt-2 lg:hidden">
          <SearchBar />
        </div>

        <div className="overflow-y-auto w-full py-3">
          {conversations.map((conv) => {
            if (conv.type === "dm") {
              const user = conv.data;
              const isSelected = selectedUser?._id === user._id;
              return (
                <button
                  key={`dm_${user._id}`}
                  onClick={() => setSelectedUser(user)}
                  className={`
                    w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors
                    ${isSelected ? "bg-base-300 ring-1 ring-base-300" : ""}
                  `}
                >
                  <div className="relative mx-0">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullname}
                      className="size-12 object-cover rounded-full"
                    />
                    {onlineUsers.includes(user._id) && (
                      <span className="absolute bottom-0 right-0 size-2 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                    )}
                    {(user.unreadCount ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-content text-xs flex items-center justify-center font-medium">
                        {user.unreadCount! > 99 ? "99+" : user.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 min-w-0 items-start justify-between gap-1 text-left">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.fullname}</div>
                      <div className="text-sm text-base-content/40 truncate">
                        {user.lastMessage
                          ? user.lastMessage.image && !user.lastMessage.text
                            ? "[picture]"
                            : user.lastMessage.text
                          : ""}
                      </div>
                    </div>
                    {user.lastMessage?.createdAt && (
                      <span className="text-xs text-base-content/50 shrink-0 mt-0.5">
                        {formatChatTime(user.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                </button>
              );
            } else {
              const group = conv.data;
              const isSelected = selectedGroup?._id === group._id;
              return (
                <button
                  key={`group_${group._id}`}
                  onClick={() => setSelectedGroup(group)}
                  className={`
                    w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors
                    ${isSelected ? "bg-base-300 ring-1 ring-base-300" : ""}
                  `}
                >
                  <div className="relative mx-0">
                    <img
                      src={group.avatar || "/avatar.png"}
                      alt={group.name}
                      className="size-12 object-cover rounded-full"
                    />
                  </div>
                  <div className="flex flex-1 min-w-0 items-start justify-between gap-1 text-left">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{group.name}</div>
                      <div className="text-sm text-base-content/40 truncate">
                        {group.lastMessage
                          ? group.lastMessage.image && !group.lastMessage.text
                            ? `${group.lastMessage.senderName}: [picture]`
                            : `${group.lastMessage.senderName}: ${group.lastMessage.text}`
                          : ""}
                      </div>
                    </div>
                    {group.lastMessage?.createdAt && (
                      <span className="text-xs text-base-content/50 shrink-0 mt-0.5">
                        {formatChatTime(group.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                </button>
              );
            }
          })}

          {conversations.length === 0 && (
            <div className="text-center text-base-content/50 py-4">No conversations yet</div>
          )}
        </div>
      </aside>

      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}
    </>
  );
};
export default Sidebar;
