import { type FC } from "react";
import { Navigate } from "react-router-dom";

import { useLogin } from "@/api/endpoints/auth";

const LoginPage: FC = () => {
  const { mutate: login, isSuccess } = useLogin();

  if (isSuccess) return <Navigate to="/" />;

  return (
    <button
      className="btn"
      onClick={() =>
        login({
          data: { email: "user@example.com", password: "psw123" },
        })
      }
    >
      Button
    </button>
  );
};

export default LoginPage;
