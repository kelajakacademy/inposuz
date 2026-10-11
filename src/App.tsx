import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { OrderProvider, useOrder } from "./context/OrderContext";
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/LoginScreen";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminPortal } from "./components/admin/AdminPortal";
import { KitchenView } from "./components/KitchenView";
import { SuperAdminCRM } from "./components/superadmin/SuperAdminCRM";
import { SuperAdminLogin } from "./components/superadmin/SuperAdminLogin";
import { TelegramQrScanner } from "./components/superadmin/TelegramQrScanner";
import { AdminUser } from "./types";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { waiter } = useOrder();
  if (!waiter) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC = () => {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem("inpos_admin_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const navigate = useNavigate();

  const handleLoginSuccess = (user: AdminUser) => {
    localStorage.setItem("inpos_admin_session", JSON.stringify(user));
    setAdmin(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("inpos_admin_session");
    setAdmin(null);
  };

  if (!admin) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} onGoToPos={() => navigate("/")} />;
  }

  return <AdminPortal admin={admin} onLogout={handleLogout} onGoToPos={() => navigate("/")} />;
};

export default function App() {
  return (
    <OrderProvider>
      <Router>
        <div className="min-h-screen bg-[#1A1D21] text-white selection:bg-[#E74C3C]/30">
          <Routes>
            <Route path="/superadmin" element={<SuperAdminCRMWrapper />} />
            <Route path="/crm" element={<SuperAdminCRMWrapper />} />
            <Route path="/qr-scanner" element={<TelegramQrScanner />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="/register" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/register" element={<Navigate to="/admin" replace />} />
            <Route path="/kitchen" element={<div className="h-screen w-screen bg-[#141619] overflow-hidden flex flex-col"><KitchenView isStandaloneTvMode={true} /></div>} />
            <Route path="/tv" element={<div className="h-screen w-screen bg-[#141619] overflow-hidden flex flex-col"><KitchenView isStandaloneTvMode={true} /></div>} />
            <Route path="/login" element={<LoginScreen />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </OrderProvider>
  );
}

function SuperAdminCRMWrapper() {
  const [isAuth, setIsAuth] = useState<boolean>(() => {
    return localStorage.getItem("inpos_master_crm_auth") === "true";
  });
  const navigate = useNavigate();

  if (!isAuth) {
    return (
      <SuperAdminLogin
        onLoginSuccess={() => setIsAuth(true)}
        onGoToPos={() => navigate("/")}
      />
    );
  }

  return (
    <SuperAdminCRM
      onBackToPos={() => navigate("/")}
      onLogout={() => {
        localStorage.removeItem("inpos_master_crm_auth");
        setIsAuth(false);
      }}
    />
  );
}
