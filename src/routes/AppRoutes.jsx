import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import ProtectedRoute from "./ProtectedRoutes.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";
import CashierLayout from "../layouts/CashierLayout.jsx";

import Login from "../features/auth/Login.jsx";
import Dashboard from "../features/analytics/Dashboard.jsx";
import POS from "../features/invoice/POS.jsx";
import SalesReturn from "../features/invoice/SalesReturn.jsx";
import InvoiceList from "../features/invoice/InvoiceList.jsx";
import InvoiceDetail from "../features/invoice/InvoiceDetail.jsx";
import Products from "../features/product/Product.jsx";
import Customers from "../features/customer/Customer.jsx";
import CustomerHistory from "../features/customer/CustomerHistory.jsx";
import DemandPage from "../features/demand/DemandPage.jsx";

function LayoutWrapper({ children }) {
  const { user } = useSelector((s) => s.auth);

  if (user?.role === "admin") {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return <CashierLayout>{children}</CashierLayout>;
}

export default function AppRoutes() {
  const { token, user } = useSelector((s) => s.auth);

  return (
    <Routes>

      {/* ✅ Prevent logged-in user from going back to login */}
      <Route
        path="/login"
        element={
          token && user ? (
            user.role === "admin" ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/pos" replace />
            )
          ) : (
            <Login />
          )
        }
      />

      {/* ✅ Admin Dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute role="admin">
            <LayoutWrapper>
              <Dashboard />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />

      {/* ✅ POS (all logged-in users) */}
      <Route
        path="/pos"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <POS />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <InvoiceList />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/invoice/:id"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <InvoiceDetail />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/return"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <SalesReturn />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />

      {/* ✅ Admin-only routes */}
      <Route
        path="/products"
        element={
          <ProtectedRoute role="admin">
            <LayoutWrapper>
              <Products />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/demand"
        element={
          <ProtectedRoute role="admin">
            <LayoutWrapper>
              <DemandPage />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />

      {/* ✅ Shared routes */}
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <Customers />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers/:id"
        element={
          <ProtectedRoute>
            <LayoutWrapper>
              <CustomerHistory />
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />

      {/* ✅ Fallback */}
      <Route
        path="*"
        element={
          token && user ? (
            user.role === "admin" ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/pos" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}