import { keepPreviousData } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { type FC, useEffect, useRef, useState } from "react";

import type { UserResponseDto } from "@/api/endpoints/chatNestAPI.schemas";
import type { SearchGroupMessageResultDto } from "@/api/endpoints/chatNestAPI.schemas";
import { searchGroupMessages } from "@/api/endpoints/group";
import { useGetGroupList } from "@/api/endpoints/group";
import { useGetUsersList, useSearch } from "@/api/endpoints/message";
import { formatChatTime } from "@/lib/utils";
import { useChatStore } from "@/stores/useChatStore";

interface SearchBarProps {
  className?: string;
}

const SearchBar: FC<SearchBarProps> = ({ className }) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [groupMessageResults, setGroupMessageResults] = useState<
    SearchGroupMessageResultDto[]
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setSelectedUser, setPendingScrollToMessageId, setSelectedGroup } =
    useChatStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setIsOpen(query.length >= 1);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length < 1) {
      setGroupMessageResults([]);
      return;
    }
    searchGroupMessages({ q: debouncedQuery })
      .then(setGroupMessageResults)
      .catch(() => {});
  }, [debouncedQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuery("");
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setQuery("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { data: allUsers } = useGetUsersList();
  const { data: messageResults } = useSearch(
    { q: debouncedQuery },
    {
      query: {
        enabled: debouncedQuery.length >= 1,
        placeholderData: keepPreviousData,
      },
    },
  );
  const { data: allGroups } = useGetGroupList();

  const userResults =
    allUsers?.filter((u) => {
      if (!debouncedQuery) return false;
      return u.fullname.toLowerCase().includes(debouncedQuery.toLowerCase());
    }) ?? [];

  const hasResults =
    userResults.length > 0 ||
    (messageResults?.length ?? 0) > 0 ||
    groupMessageResults.length > 0;

  const handleSelectUser = (user: UserResponseDto) => {
    setSelectedUser(user);
    setQuery("");
  };

  const handleSelectGroupMessage = (msg: SearchGroupMessageResultDto) => {
    const group = allGroups?.find((g) => g._id === msg.groupId);
    if (group) {
      setSelectedGroup(group);
      setPendingScrollToMessageId(msg._id);
    }
    setQuery("");
  };

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <div className="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-1.5">
        <Search className="w-4 h-4 text-base-content/40 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users or messages..."
          className="bg-transparent outline-none w-full placeholder:text-base-content/40 text-base"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
            }}
          >
            <X className="w-4 h-4 text-base-content/40" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {!hasResults ? (
            <div className="px-4 py-3 text-sm text-base-content/50 text-center">
              No results
            </div>
          ) : (
            <>
              {userResults.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-base-content/50 uppercase tracking-wide border-b border-base-200">
                    Users
                  </div>
                  {userResults.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-base-200 transition-colors text-left"
                    >
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.fullname}
                        className="size-8 rounded-full object-cover shrink-0"
                      />
                      <span className="text-sm font-medium truncate">
                        {user.fullname}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {(messageResults?.length ?? 0) > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-base-content/50 uppercase tracking-wide border-b border-base-200">
                    Messages
                  </div>
                  {messageResults!.map((msg) => (
                    <button
                      key={msg._id}
                      onClick={() => {
                        handleSelectUser(msg.otherUser);
                        setPendingScrollToMessageId(msg._id);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-base-200 transition-colors text-left"
                    >
                      <img
                        src={msg.otherUser.profilePic || "/avatar.png"}
                        alt={msg.otherUser.fullname}
                        className="size-8 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {msg.otherUser.fullname}
                        </div>
                        <div className="text-xs text-base-content/40 truncate">
                          {msg.text}
                        </div>
                        <div className="text-xs text-base-content/30 mt-0.5">
                          {formatChatTime(msg.createdAt, true)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {groupMessageResults.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-base-content/50 uppercase tracking-wide border-b border-base-200">
                    Group Messages
                  </div>
                  {groupMessageResults.map((msg) => (
                    <button
                      key={msg._id}
                      onClick={() => handleSelectGroupMessage(msg)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-base-200 transition-colors text-left"
                    >
                      <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                        {msg.groupName[0]?.toUpperCase() ?? "G"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {msg.groupName}
                        </div>
                        <div className="text-xs text-base-content/50 truncate">
                          {msg.senderName}: {msg.text}
                        </div>
                        <div className="text-xs text-base-content/30 mt-0.5">
                          {formatChatTime(msg.createdAt, true)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
