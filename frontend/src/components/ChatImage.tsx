import "yet-another-react-lightbox/styles.css";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

interface Props {
  src: string;
  slides: { src: string }[];
  index: number;
  pending?: boolean;
}

const ChatImage = ({ src, slides, index, pending }: Props) => {
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <>
      {!loaded && <div className="skeleton w-[200px] h-32 rounded-md mb-2" />}
      <div className={`relative ${loaded ? "" : "opacity-0 h-0"}`}>
        <img
          src={src}
          alt="Attachment"
          className={`sm:max-w-[200px] rounded-md mb-2 ${pending ? "" : "cursor-pointer"}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onClick={pending ? undefined : () => setOpen(true)}
        />
        {pending && loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md mb-2">
            <span className="loading loading-spinner loading-sm text-white" />
          </div>
        )}
      </div>
      <Lightbox
        open={open}
        index={index}
        slides={slides}
        plugins={[Zoom]}
        close={() => setOpen(false)}
      />
    </>
  );
};

export default ChatImage;
