import { verifyToken } from "@/api/user-service";
import Spinner from "@/components/custom/spinner";
import { useEffect, useTransition } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

const RouteGuard = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [loading, startTransition] = useTransition();

  const publicRoutes = [
    "/login",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
  ];

  useEffect(() => {
    startTransition(async () => {
      const isPublicRoute = publicRoutes.reduce(
        (result, route) => result || pathname.startsWith(route),
        false
      );
      try {
        await verifyToken();
        if (isPublicRoute) {
          navigate("/");
        }
      } catch {
        if (!isPublicRoute) {
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
