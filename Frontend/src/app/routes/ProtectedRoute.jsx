import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { getRoleHomePath } from "../../features/auth/utils/roleRedirect";

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, isUserLoading } = useAuth();

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        جاري تحميل بيانات المستخدم...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        جاري تحميل بيانات المستخدم...
      </div>
    );
  }

  if (!user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  return children;
}
