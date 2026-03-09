import "yet-another-react-lightbox/styles.css";

import { useState } from "react";
import Lightbox, { type SlideImage } from "yet-another-react-lightbox";

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
      <div
        className={`relative self-start max-w-[200px] ${loaded ? "mb-2" : "h-0 overflow-hidden"}`}
      >
        <img
          src={src}
          alt="Attachment"
          className={`block w-full rounded-md ${pending ? "" : "cursor-pointer"}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onClick={pending ? void 0 : () => setOpen(true)}
        />
        {pending && loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md">
            <span className="loading loading-spinner loading-sm text-white" />
          </div>
        )}
      </div>
      <Lightbox
        open={open}
        index={index}
        slides={slides}
        close={() => setOpen(false)}
        render={{
          slide: ({ slide }) => (
            <img
              src={(slide as SlideImage).src}
              alt="Attachment"
              draggable={false}
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
          ),
        }}
      />
    </>
  );
};

export default ChatImage;
