import type { FC } from "react";
import { Navigate } from "react-router-dom";

import { useLogout } from "@/api/endpoints/auth";

const HomePage: FC = () => {
  const { mutate: logout, isSuccess } = useLogout();

  if (isSuccess) return <Navigate to="/login" />;

  return (
    <button className="btn" onClick={() => logout()}>
      Logout
    </button>
  );
};

export default HomePage;
