import { Loader } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useRoutes } from "react-router-dom";

import { useCheckAuth } from "@/api/endpoints/auth";
import { setNavigate } from "@/lib/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import routes from "~react-pages";

function App() {
  const pages = useRoutes(routes);
  const navigate = useNavigate();
  const { setAuthUser } = useAuthStore();
  const { data: authUser, isLoading: isAuthLoading } = useCheckAuth({
    query: {
      retry: false,
    },
  });

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  useEffect(() => {
    setAuthUser(authUser);
  }, [authUser, setAuthUser]);

  if (isAuthLoading && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return pages;
}

export default App;
