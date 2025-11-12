import { logout } from "@/api/user-service";
import Logo from "@/components/custom/app-logo";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import React from "react";
import { Link, useLocation, useNavigate } from "react-router";

const Header: React.FC = () => {
  const isAdmin = localStorage.getItem("isAdmin") == "true";
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="w-full text-slate-900 py-4 px-6 shadow-sm">
      <div className="flex items-center justify-between">
        <Logo />

        {!pathname.includes("/collaborate/") && (
          <nav className="flex items-center space-x-4">
            <Link to="/" className="hover:underline text-indigo-600">
              Home
            </Link>
            {isAdmin && (
              <Link to="/admin" className="hover:underline text-indigo-600">
                Admin
              </Link>
            )}
            <Link to="/profile" className="hover:underline text-indigo-600">
              Profile
            </Link>

            {/* Logout button with confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Log Out</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The current session will be terminated, and you will be
                    logged out.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onLogout}>
                    Log Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
