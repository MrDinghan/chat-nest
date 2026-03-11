import { ArrowLeft, Camera, Trash2, X } from "lucide-react";
import { type FC, useRef } from "react";
import toast from "react-hot-toast";

import { dissolveGroup, updateGroupAvatar } from "@/api/endpoints/group";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";

const ChatHeader: FC = () => {
  const { selectedUser, setSelectedUser, selectedGroup, setSelectedGroup } =
    useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isGroupOwner =
    selectedGroup && authUser && selectedGroup.ownerId === authUser._id;

  const handleDissolve = async () => {
    if (!selectedGroup) return;
    if (
      !window.confirm(
        `Dissolve group "${selectedGroup.name}"? This cannot be undone.`,
      )
    )
      return;
    await dissolveGroup(selectedGroup._id);
    setSelectedGroup(void 0);
    toast.success("Group dissolved");
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGroup) return;
    const formData = new FormData();
    formData.append("image", file);
    await updateGroupAvatar(selectedGroup._id, { image: file });
    toast.success("Group avatar updated");
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleClose = () => {
    if (selectedGroup) setSelectedGroup(void 0);
    else setSelectedUser(void 0);
  };

  if (selectedGroup) {
    return (
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={selectedGroup.avatar || "/avatar.png"}
                alt={selectedGroup.name}
                className="size-10 rounded-full object-cover"
              />
              {isGroupOwner && (
                <>
                  <button
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                    onClick={() => avatarInputRef.current?.click()}
                    title="Change group avatar"
                  >
                    <Camera className="size-4 text-white" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </>
              )}
            </div>
            <div>
              <h3 className="font-medium">{selectedGroup.name}</h3>
              <p className="text-xs text-base-content/50">
                {selectedGroup.members.length} members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isGroupOwner && (
              <button
                onClick={handleDissolve}
                className="btn btn-ghost btn-sm text-error gap-1"
                title="Dissolve group"
              >
                <Trash2 className="size-4" />
                <span className="hidden sm:inline">Dissolve</span>
              </button>
            )}
            <button onClick={handleClose}>
              <ArrowLeft className="lg:hidden" />
              <X className="hidden lg:block" />
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <button onClick={handleClose}>
          <ArrowLeft className="lg:hidden" />
          <X className="hidden lg:block" />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
