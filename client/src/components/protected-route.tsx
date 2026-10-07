import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <main className="page-center">Restoring your session...</main>;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}
