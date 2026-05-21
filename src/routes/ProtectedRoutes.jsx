import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const { token, user } = useSelector((s) => s.auth);
  console.log("ProtectedRoute check:", {
  token,
  user,
  roleRequired: role
});
  // ❌ Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Agar specific role required hai aur match nahi karta
  if (role && user?.role !== role) {
    // cashier ko admin route se POS pe bhejo
    return <Navigate to="/pos" replace />;
  }

  // ✅ Allow access
  return children;
}