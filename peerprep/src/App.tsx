import RouteGuard from "@/components/custom/route-guard";
import { Toaster } from "@/components/ui/sonner";
import Admin from "@/pages/Admin";
import ForgotPassword from "@/pages/ForgotPassword";
import Homepage from "@/pages/Homepage/Homepage";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import ResetPassword from "@/pages/ResetPassword";
import SignUp from "@/pages/SignUp";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router";

function App() {
  return (
    <div className="min-h-dvh bg-gray-100">
      <Router>
        <Routes>
          <Route element={<RouteGuard />}>
            <Route path="/login" element={<Login />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/" element={<Homepage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
