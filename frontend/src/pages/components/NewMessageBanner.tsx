import { ArrowDown } from "lucide-react";
import type { FC } from "react";

interface Props {
  count: number;
  onClick: () => void;
}

const NewMessageBanner: FC<Props> = ({ count, onClick }) => (
  <button
    onClick={onClick}
    className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10
      flex items-center gap-1.5 btn btn-primary btn-sm shadow-lg"
  >
    <ArrowDown size={14} />
    {count} new message{count > 1 ? "s" : ""}
  </button>
);

export default NewMessageBanner;
