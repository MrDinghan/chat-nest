import { useMemo } from "react";

import { useGetGroupMessages } from "@/api/endpoints/group";
import { useGetMessages } from "@/api/endpoints/message";
import { useChatStore } from "@/stores/useChatStore";
import { normalizeDmMessage, normalizeGroupMessage } from "@/types/conversation";

export function useConversationMessages() {
  const { selectedUser, selectedGroup } = useChatStore();

  const dmQuery = useGetMessages(selectedUser?._id ?? "", {
    query: { enabled: !!selectedUser },
  });
  const groupQuery = useGetGroupMessages(selectedGroup?._id ?? "", {
    query: { enabled: !!selectedGroup },
  });

  const messages = useMemo(() => {
    if (selectedGroup) return (groupQuery.data ?? []).map(normalizeGroupMessage);
    return (dmQuery.data ?? []).map(normalizeDmMessage);
  }, [selectedGroup, dmQuery.data, groupQuery.data]);

  const isLoading = selectedGroup ? groupQuery.isLoading : dmQuery.isLoading;

  return { messages, isLoading };
}
