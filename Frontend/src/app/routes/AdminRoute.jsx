import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";

export function AdminRoute({ children }) {
  const { isAuthenticated, user, isUserLoading } = useAuth();
  const location = useLocation();

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#075fd6] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.role !== "ADMIN") {
    // If authenticated but not admin, redirect to landing or home
    return <Navigate to="/" replace />;
  }

  return children;
}
