import { verifyToken } from "@/api/user-service";
import Spinner from "@/components/custom/spinner";
import { useEffect, useTransition } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

const RouteGuard = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [loading, startTransition] = useTransition();

  const publicRoutes = ["/login", "/sign-up"];

  useEffect(() => {
    startTransition(async () => {
      try {
        await verifyToken();
        if (publicRoutes.includes(pathname)) {
          navigate("/");
        }
      } catch {
        if (!publicRoutes.includes(pathname)) {
          navigate("/login");
        }
      }
    });
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return <Outlet />;
};

export default RouteGuard;
