import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import Login from "./auth/Login.jsx";
import Signup from "./auth/Signup.jsx";
import OtpVerify from "./auth/OtpVerify.jsx";
import ForgotPassword from "./auth/ForgotPassword.jsx";
import ResetPassword from "./auth/ResetPassword.jsx";
import AuthLayout from "./auth/AuthLayout.jsx";
import DashboardRoutes from "./pages/dashboard/DashboardRoutes.jsx";
import Verify from "./pages/verify/Verify.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { ProtectedRoute } from "./auth/ProtectedRoute.jsx";
import "./styles.css";
import "./auth/auth.css";
import "./pages/dashboard/dashboard.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          {/* Public verification page — citizen-facing, no auth, the QR target. */}
          <Route path="/v" element={<Verify />} />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<OtpVerify />} />
            <Route
              path="/login-verify"
              element={<OtpVerify />}
              // OtpVerify branches on ?context=login
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardRoutes />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
