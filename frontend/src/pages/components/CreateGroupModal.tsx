import { X } from "lucide-react";
import { type FC, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

import {
  createGroup,
  getGetConversationListQueryKey,
} from "@/api/endpoints/conversation";
import { useGetUserList } from "@/api/endpoints/user";
import Avatar from "@/components/Avatar";
import { queryClient } from "@/lib/queryClient";
import { useChatStore } from "@/stores/useChatStore";

interface CreateGroupModalProps {
  onClose: () => void;
}

const CreateGroupModal: FC<CreateGroupModalProps> = ({ onClose }) => {
  const { setSelectedConversation } = useChatStore();
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const { data: users } = useGetUserList();

  const filtered = (users ?? []).filter((u) =>
    u.fullname.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedIds.size === 0) {
      toast.error("Please select at least one member");
      return;
    }
    setIsCreating(true);
    try {
      const conv = await createGroup({
        name: groupName.trim(),
        memberIds: [...selectedIds],
      });
      await queryClient.invalidateQueries({
        queryKey: getGetConversationListQueryKey(),
      });
      toast.success(`Group "${conv.name}" created`);
      setSelectedConversation(conv);
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-md mx-4 flex flex-col h-[80dvh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">New Group</h2>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        {/* Fixed inputs area */}
        <div className="flex flex-col gap-3 px-4 pt-4 shrink-0">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap gap-1 pb-2">
              {[...selectedIds].map((id) => {
                const user = users?.find((u) => u._id === id);
                return (
                  <span
                    key={id}
                    className="badge badge-primary gap-1 cursor-pointer"
                    onClick={() => toggleMember(id)}
                  >
                    {user?.fullname}
                    <X className="size-3" />
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Scrollable user list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2">
          <div className="flex flex-col divide-y divide-base-200">
            {filtered.map((user) => (
              <label
                key={user._id}
                className="flex items-center gap-3 py-2 cursor-pointer hover:bg-base-200 px-2 rounded-lg"
              >
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-sm"
                  checked={selectedIds.has(user._id)}
                  onChange={() => toggleMember(user._id)}
                />
                <Avatar
                  src={user.profilePic}
                  name={user.fullname}
                  className="size-8 rounded-full"
                />
                <span className="font-medium">{user.fullname}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-base-content/50 py-4 text-sm">
                No users found
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-300">
          <button
            className="btn btn-primary w-full"
            onClick={handleCreate}
            disabled={isCreating || !groupName.trim() || selectedIds.size === 0}
          >
            {isCreating ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CreateGroupModal;
