import { type FC, useEffect } from "react";

import { requestNotificationPermission } from "@/lib/notification";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";

import ChatContainer from "./components/ChatContainer";
import NoChatSelected from "./components/NoChatSelected";
import Sidebar from "./components/Sidebar";
import { useNotificationSocket } from "./hooks/useNotificationSocket";

const HomePage: FC = () => {
  const { selectedConversation } = useChatStore();
  const { authUser } = useAuthStore();
  const authPic = authUser?.profilePic;
  const hasSelected = !!selectedConversation;

  useNotificationSocket();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // cache profile pictures to improve performance
  useEffect(() => {
    if (authPic) {
      const img = new window.Image();
      img.src = authPic;
    }
  }, [authPic]);

  return (
    <div className="h-dvh bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100dvh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <div
              className={
                hasSelected ? "hidden lg:block" : "block w-full lg:w-auto"
              }
            >
              <Sidebar />
            </div>
            <div
              className={`flex-1 flex ${!hasSelected ? "hidden lg:flex" : ""}`}
            >
              {!hasSelected ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
