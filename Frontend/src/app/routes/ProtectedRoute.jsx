import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  // المستخدم مش عامل login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // التوكن موجود ولسه بنجيب بيانات المستخدم من getMe
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        جاري تحميل بيانات المستخدم...
      </div>
    );
  }

  // لسه مكمّلش اختيار GUEST أو HOST
  if (!user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  // المستخدم مسجل دخول لكن الـ role مش مسموح له
  if (
    allowedRoles?.length &&
    !allowedRoles.includes(user.role)
  ) {
    const redirectPath =
      user.role === "HOST" ? "/owner" : "/expatriate";

    return <Navigate to={redirectPath} replace />;
  }

  return children;
}