import { verifyToken } from "@/api/user-service";
import Spinner from "@/components/custom/spinner";
import Footer from "@/components/ui/Footer";
import Header from "@/components/ui/Header";
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
  const isPublicRoute = publicRoutes.reduce(
    (result, route) => result || pathname.startsWith(route),
    false
  );

  useEffect(() => {
    startTransition(async () => {
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
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-53px)]">
        {isPublicRoute ? (
          <Outlet />
        ) : (
          <>
            <Header />
            <div className="w-full min-h-[calc(100vh-121px)] bg-slate-50 text-slate-900 flex flex-col items-center justify-center">
              <Outlet />
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default RouteGuard;
