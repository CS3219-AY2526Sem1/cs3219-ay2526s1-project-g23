import { Toaster } from "@/components/ui/sonner";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router";
import Homepage from "@/pages/Homepage";

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 gap-4">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="*" element={<Navigate to="/login" />} />
          <Route path="/homepage" element={<Homepage />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
