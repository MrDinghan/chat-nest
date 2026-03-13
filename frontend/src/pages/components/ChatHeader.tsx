import { ArrowLeft, Camera, Trash2, X } from "lucide-react";
import { type FC, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

import {
  useDissolveConversation,
  useUpdateGroupAvatar,
} from "@/api/endpoints/conversation";
import Avatar from "@/components/Avatar";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";

const ChatHeader: FC = () => {
  const { selectedConversation, setSelectedConversation } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);
  const { mutate: updateAvatar, isPending: isUpdatingAvatar } = useUpdateGroupAvatar({
    mutation: {
      onSuccess: () => {
        toast.success("Group avatar updated");
        if (avatarInputRef.current) avatarInputRef.current.value = "";
      },
    },
  });
  const { mutate: dissolve, isPending: isDissolving } = useDissolveConversation({
    mutation: {
      onSuccess: () => {
        setShowDissolveConfirm(false);
        setSelectedConversation(void 0);
        toast.success("Group dissolved");
      },
    },
  });

  const isGroup = selectedConversation?.type === "group";
  const isGroupOwner =
    isGroup && authUser && selectedConversation?.owner?._id === authUser._id;

  const otherMember = !isGroup
    ? selectedConversation?.members.find((m) => m._id !== authUser?._id)
    : null;

  const displayPic = isGroup
    ? selectedConversation?.avatar
    : otherMember?.profilePic;

  const displayName = isGroup
    ? (selectedConversation?.name ?? "Group")
    : (otherMember?.fullname ?? "");

  const handleDissolve = () => {
    if (!selectedConversation) return;
    dissolve({ id: selectedConversation._id });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;
    updateAvatar({ id: selectedConversation._id, data: { image: file } });
  };

  const handleClose = () => setSelectedConversation(void 0);

  return (
    <>
      {showDissolveConfirm &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Dissolve group?</h3>
              <p className="text-base-content/70 text-sm">
                Are you sure you want to dissolve{" "}
                <span className="font-medium">
                  {selectedConversation?.name}
                </span>
                ? This cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowDissolveConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-error btn-sm"
                  disabled={isDissolving}
                  onClick={handleDissolve}
                >
                  {isDissolving
                    ? <span className="loading loading-spinner loading-xs" />
                    : "Dissolve"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar
                src={displayPic}
                name={displayName}
                className="size-10 rounded-full"
              />
              {isGroupOwner && (
                <>
                  <button
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity disabled:opacity-60"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUpdatingAvatar}
                    title="Change group avatar"
                  >
                    {isUpdatingAvatar
                      ? <span className="loading loading-spinner loading-xs text-white" />
                      : <Camera className="size-4 text-white" />}
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
              {!isGroup &&
                otherMember &&
                onlineUsers.includes(otherMember._id) && (
                  <span className="absolute bottom-0 right-0 size-2 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
            </div>

            <div>
              <h3 className="font-medium">{displayName}</h3>
              {isGroup && (
                <p className="text-xs text-base-content/50">
                  {selectedConversation?.members.length} members
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isGroupOwner && (
              <button
                onClick={() => setShowDissolveConfirm(true)}
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
    </>
  );
};

export default ChatHeader;
