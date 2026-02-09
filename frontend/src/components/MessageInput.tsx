import { Image, Send, X } from "lucide-react";
import { type FC, useRef, useState } from "react";
import toast from "react-hot-toast";

import { usePostMessage } from "@/api/endpoints/message";
import { useChatStore } from "@/stores/useChatStore";

const MessageInput: FC = () => {
  const { selectedUser, messages, setMessages } = useChatStore();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string>();
  const [imageFile, setImageFile] = useState<File>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: sendMessage } = usePostMessage();

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

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;
    sendMessage(
      {
        id: selectedUser?._id ?? "",
        data: {
          text: text.trim() || undefined,
          image: imageFile,
        },
      },
      {
        onSuccess: (newMsg) => {
          setText("");
          if (imagePreview) URL.revokeObjectURL(imagePreview);
          setImagePreview(void 0);
          setImageFile(void 0);
          if (fileInputRef.current) fileInputRef.current.value = "";
          setMessages([...messages, newMsg]);
        },
      },
    );
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
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
            className={`hidden sm:flex btn btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imageFile}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;
