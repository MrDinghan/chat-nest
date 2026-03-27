import { useState, type FC } from "react";

interface AvatarProps {
  src?: string;
  name: string;
  className?: string;
}

const Avatar: FC<AvatarProps> = ({ src, name, className = "size-10 rounded-full" }) => {
  const [loaded, setLoaded] = useState(false);

  const fallback = (
    <div
      className={`${className} bg-primary/20 flex items-center justify-center font-bold text-primary`}
    >
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );

  if (src) {
    return (
      <>
        {!loaded && fallback}
        <img
          src={src}
          alt={name}
          className={`${className} object-cover${loaded ? "" : " hidden"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(false)}
        />
      </>
    );
  }
  return fallback;
};

export default Avatar;
