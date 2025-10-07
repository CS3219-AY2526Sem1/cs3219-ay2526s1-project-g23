import React from "react";
import { useNavigate } from "react-router";
import { logout } from "@/api/user-service";

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

const Header: React.FC = () => {
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="w-full text-slate-900 py-4 px-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-indigo-600">PeerPrep</h1>

        <nav className="flex items-center space-x-4">
          <a href="/" className="hover:underline text-indigo-600">
            Home
          </a>
          <a href="/user-profile" className="hover:underline text-indigo-600">
            User Profile
          </a>

          {/* Logout button with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Log Out</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  The current session will be terminated, and you will be logged out.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onLogout}>Log Out</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </nav>
      </div>
    </header>
  );
};

export default Header;
