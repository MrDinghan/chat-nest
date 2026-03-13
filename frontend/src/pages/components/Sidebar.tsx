import { SquarePen, Users } from "lucide-react";
import { type FC, useEffect, useState } from "react";

import type {
  ConversationResponseDto,
  UserResponseDto,
} from "@/api/endpoints/chatNestAPI.schemas";
import {
  getGetConversationListQueryKey,
  useGetConversationList,
} from "@/api/endpoints/conversation";
import { findOrCreateDm } from "@/api/endpoints/conversation";
import { useGetUserList } from "@/api/endpoints/user";
import { queryClient } from "@/lib/queryClient";
import { formatChatTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";

import CreateGroupModal from "./CreateGroupModal";
import SearchBar from "./SearchBar";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";

const Sidebar: FC = () => {
  const { selectedConversation, setSelectedConversation } = useChatStore();
  const { onlineUsers, socket, authUser } = useAuthStore();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [activeTab, setActiveTab] = useState<"chats" | "people">("chats");

  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      queryClient.invalidateQueries({
        queryKey: getGetConversationListQueryKey(),
      });
    };
    socket.on("newMessage", handler);
    socket.on("conversationCreated", handler);
    socket.on("messagesRead", handler);
    return () => {
      socket.off("newMessage", handler);
      socket.off("conversationCreated", handler);
      socket.off("messagesRead", handler);
    };
  }, [socket]);

  const { data: conversations, isLoading: isConvsLoading } =
    useGetConversationList();
  const { data: users, isLoading: isUsersLoading } = useGetUserList();

  const isLoading = activeTab === "chats" ? isConvsLoading : isUsersLoading;

  if (isLoading && activeTab === "chats" && !conversations) {
    return <SidebarSkeleton />;
  }

  const getConvDisplayName = (conv: ConversationResponseDto) => {
    if (conv.type === "group") return conv.name ?? "Group";
    const other = conv.members.find((m) => m._id !== authUser?._id);
    return other?.fullname ?? "";
  };

  const getConvDisplayPic = (conv: ConversationResponseDto) => {
    if (conv.type === "group") return conv.avatar || "/avatar.png";
    const other = conv.members.find((m) => m._id !== authUser?._id);
    return other?.profilePic || "/avatar.png";
  };

  const getOtherMember = (conv: ConversationResponseDto) =>
    conv.members.find((m) => m._id !== authUser?._id);

  const handleSelectUser = async (user: UserResponseDto) => {
    try {
      const conv = await findOrCreateDm({ memberId: user._id });
      setSelectedConversation(conv);
      queryClient.invalidateQueries({
        queryKey: getGetConversationListQueryKey(),
      });
    } catch {
      // ignore
    }
  };

  const sortedConversations = [...(conversations ?? [])].sort((a, b) => {
    const ta = a.lastMessage?.createdAt
      ? new Date(a.lastMessage.createdAt).getTime()
      : new Date(a.createdAt).getTime();
    const tb = b.lastMessage?.createdAt
      ? new Date(b.lastMessage.createdAt).getTime()
      : new Date(b.createdAt).getTime();
    return tb - ta;
  });

  return (
    <>
      <aside className="h-full w-full lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
        <div className="border-b border-base-300 w-full p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-lg">
              {activeTab === "chats" ? "Chats" : "People"}
            </span>
            <button
              className="btn btn-ghost btn-sm btn-circle"
              onClick={() => setShowCreateGroup(true)}
              title="Create group"
            >
              <SquarePen className="size-5" />
            </button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => setActiveTab("chats")}
              className={`flex-1 text-sm py-1 rounded-lg transition-colors ${
                activeTab === "chats"
                  ? "bg-primary text-primary-content"
                  : "hover:bg-base-200"
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setActiveTab("people")}
              className={`flex-1 text-sm py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                activeTab === "people"
                  ? "bg-primary text-primary-content"
                  : "hover:bg-base-200"
              }`}
            >
              <Users className="size-3.5" />
              People
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="px-3 pt-2 lg:hidden">
          <SearchBar />
        </div>

        <div className="overflow-y-auto w-full py-3">
          {activeTab === "chats" ? (
            <>
              {sortedConversations.map((conv) => {
                const isSelected = selectedConversation?._id === conv._id;
                const displayName = getConvDisplayName(conv);
                const displayPic = getConvDisplayPic(conv);
                const otherMember = getOtherMember(conv);
                const isOnline =
                  conv.type === "dm" && otherMember
                    ? onlineUsers.includes(otherMember._id)
                    : false;

                return (
                  <button
                    key={conv._id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                      isSelected ? "bg-base-300 ring-1 ring-base-300" : ""
                    }`}
                  >
                    <div className="relative mx-0">
                      <img
                        src={displayPic}
                        alt={displayName}
                        className="size-12 object-cover rounded-full"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 size-2 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                      )}
                      {(conv.unreadCount ?? 0) > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-content text-xs flex items-center justify-center font-medium">
                          {conv.unreadCount! > 99 ? "99+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 min-w-0 items-start justify-between gap-1 text-left">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {displayName}
                        </div>
                        <div className="text-sm text-base-content/40 truncate">
                          {conv.lastMessage
                            ? conv.lastMessage.image && !conv.lastMessage.text
                              ? conv.type === "group"
                                ? `${conv.lastMessage.senderName}: [picture]`
                                : "[picture]"
                              : conv.type === "group" &&
                                  conv.lastMessage.senderName
                                ? `${conv.lastMessage.senderName}: ${conv.lastMessage.text}`
                                : conv.lastMessage.text
                            : ""}
                        </div>
                      </div>
                      {conv.lastMessage?.createdAt && (
                        <span className="text-xs text-base-content/50 shrink-0 mt-0.5">
                          {formatChatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {sortedConversations.length === 0 && (
                <div className="text-center text-base-content/50 py-4">
                  No conversations yet
                </div>
              )}
            </>
          ) : (
            <>
              {(users ?? []).map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors"
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
                  </div>
                  <div className="text-left">
                    <div className="font-medium truncate">{user.fullname}</div>
                    <div className="text-xs text-base-content/40">
                      {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                    </div>
                  </div>
                </button>
              ))}
              {(users ?? []).length === 0 && (
                <div className="text-center text-base-content/50 py-4">
                  No other users
                </div>
              )}
            </>
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
