import type { FC } from "react";

interface AvatarProps {
  src?: string;
  name: string;
  className?: string;
}

const Avatar: FC<AvatarProps> = ({ src, name, className = "size-10 rounded-full" }) => {
  if (src) {
    return <img src={src} alt={name} className={`${className} object-cover`} />;
  }
  return (
    <div
      className={`${className} bg-primary/20 flex items-center justify-center font-bold text-primary`}
    >
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
};

export default Avatar;
