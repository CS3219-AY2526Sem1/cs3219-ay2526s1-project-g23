import RouteGuard from "@/components/custom/route-guard";
import { Toaster } from "@/components/ui/sonner";
import ForgotPassword from "@/pages/ForgotPassword";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router";

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 gap-4">
      <Router>
        <Routes>
          <Route element={<RouteGuard />}>
            <Route path="/login" element={<Login />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<Home />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
