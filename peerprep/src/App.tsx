import RouteGuard from "@/components/custom/route-guard";
import { Toaster } from "@/components/ui/sonner";
import ForgotPassword from "@/pages/ForgotPassword";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import SignUp from "@/pages/SignUp";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router";
import Homepage from "@/pages/Homepage";

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 gap-4">
      <Router>
        <Routes>
          <Route element={<RouteGuard />}>
            <Route path="/login" element={<Login />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
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
