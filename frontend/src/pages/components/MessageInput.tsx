import { Image, Send, X } from "lucide-react";
import { type FC, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import TextareaAutosize from "react-textarea-autosize";

import { uploadImage } from "@/api/endpoints/conversation";
import { useAuthStore } from "@/stores/useAuthStore";
import type { ConversationMessage } from "@/stores/useChatStore";
import { useChatStore } from "@/stores/useChatStore";

const MessageInput: FC = () => {
  const {
    selectedConversation,
    messages,
    setMessages,
    replaceMessage,
    markMessageFailed,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string>();
  const [imageFile, setImageFile] = useState<File>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(void 0);
    setImageFile(void 0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const doSend = (
    tempId: string,
    conversationId: string,
    textToSend: string | undefined,
    imageUrl: string | undefined,
    blobPreview: string | undefined,
  ) => {
    socket?.emit(
      "sendMessage",
      { conversationId, text: textToSend, imageUrl },
      (result) => {
        if (blobPreview) URL.revokeObjectURL(blobPreview);
        if ("error" in result) {
          markMessageFailed(tempId);
        } else {
          replaceMessage(tempId, result as ConversationMessage);
        }
      },
    );
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;
    if (!selectedConversation || !authUser) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: ConversationMessage = {
      _id: tempId,
      clientId: tempId,
      pending: true,
      sender: {
        _id: authUser._id,
        fullname: authUser.fullname,
        profilePic: authUser.profilePic,
      },
      conversation: selectedConversation,
      text: text.trim() || void 0,
      image: imagePreview,
      _retryFile: imageFile,
      readBy: [],
      reactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages([...messages, optimisticMsg]);

    const prevText = text.trim();
    const prevImagePreview = imagePreview;
    const prevImageFile = imageFile;
    setText("");
    setImagePreview(void 0);
    setImageFile(void 0);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (prevImageFile) {
      try {
        const { imageUrl } = await uploadImage({ image: prevImageFile });
        doSend(
          tempId,
          selectedConversation._id,
          prevText,
          imageUrl,
          prevImagePreview,
        );
      } catch {
        if (prevImagePreview) URL.revokeObjectURL(prevImagePreview);
        markMessageFailed(tempId);
      }
    } else {
      doSend(
        tempId,
        selectedConversation._id,
        prevText,
        undefined,
        prevImagePreview,
      );
    }
  };

  useEffect(() => {
    setText("");
    removeImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?._id]);

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-base-300"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-end gap-2">
        <div className="flex-1 flex gap-2">
          <TextareaAutosize
            minRows={1}
            maxRows={5}
            className="w-full textarea textarea-bordered rounded-lg resize-none text-base"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            className={`sm:flex btn btn-circle ${imagePreview ? "text-success" : "text-base-content/40"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-circle"
          disabled={!text.trim() && !imageFile}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
