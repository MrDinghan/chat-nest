import { House } from "lucide-react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";

const NotFoundPage: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-dvh gap-4">
      <p className="text-8xl font-bold text-base-content/20">404</p>
      <h1 className="text-2xl font-semibold">Page Not Found</h1>
      <p className="text-base-content/50">
        The page you're looking for doesn't exist.
      </p>
      <button className="btn btn-primary mt-2" onClick={() => navigate("/")}>
        <House size={18} />
        Back to Home
      </button>
    </div>
  );
};

export default NotFoundPage;
