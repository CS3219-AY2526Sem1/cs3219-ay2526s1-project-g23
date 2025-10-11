import Header from "@/components/ui/Header";
import { Outlet } from "react-router";

const Layout = () => {
  return (
    <>
      <Header />
      <div className="w-full min-h-[calc(100vh-121px)] bg-slate-50 text-slate-900 flex flex-col items-center justify-center">
        <Outlet />
      </div>
    </>
  );
};

export default Layout;
