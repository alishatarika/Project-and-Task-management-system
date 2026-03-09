import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Footer from "../components/Footer";
import Login from "../pages/login";
import Register from "../pages/registration";
import ForgotPassword from "../pages/forgot_password";
import VerifyOTP from "../pages/verify_otp";
import ProfilePage from "../pages/profile";
import { isLoggedIn } from "../utils/auth";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function AppRouter() {
  return (
    <BrowserRouter>
    
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "8px",
            fontSize: "14px",
          },
          success: {
            style: { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" },
            iconTheme: { primary: "#16a34a", secondary: "#f0fdf4" },
          },
          error: {
            style: { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" },
            iconTheme: { primary: "#dc2626", secondary: "#fef2f2" },
          },
        }}
      />

      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div className="flex items-center justify-center min-h-screen">
                    <h1 className="text-2xl font-bold text-gray-700">Welcome Home!</h1>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}