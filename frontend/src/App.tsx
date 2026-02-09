import { Loader } from "lucide-react";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useLocation, useNavigate, useRoutes } from "react-router-dom";

import { useCheckAuth } from "@/api/endpoints/auth";
import { setNavigate } from "@/lib/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import routes from "~react-pages";

import Navbar from "./components/Navbar";
import { useThemeStore } from "./stores/useThemeStore";

function App() {
  const pages = useRoutes(routes);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { setAuthUser, connectSocket } = useAuthStore();
  const { theme } = useThemeStore();

  const isAuthPage = ["/login", "/signup"].includes(pathname);
  const { data: authUser, isLoading: isAuthLoading } = useCheckAuth({
    query: {
      retry: false,
      enabled: !isAuthPage,
    },
  });

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  useEffect(() => {
    setAuthUser(authUser);
    connectSocket();
  }, [authUser, setAuthUser, connectSocket]);

  if (isAuthLoading && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      <Toaster />
      <Navbar />
      {pages}
    </div>
  );
}

export default App;
