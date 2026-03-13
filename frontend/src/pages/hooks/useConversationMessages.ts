import { useMemo } from "react";

import { useGetMessages } from "@/api/endpoints/conversation";
import type { ConversationMessage } from "@/stores/useChatStore";
import { useChatStore } from "@/stores/useChatStore";

export function useConversationMessages() {
  const { selectedConversation } = useChatStore();

  const query = useGetMessages(selectedConversation?._id ?? "", {
    query: { enabled: !!selectedConversation },
  });

  const messages = useMemo(
    () => (query.data ?? []) as unknown as ConversationMessage[],
    [query.data],
  );

  return { messages, isLoading: query.isLoading };
}
