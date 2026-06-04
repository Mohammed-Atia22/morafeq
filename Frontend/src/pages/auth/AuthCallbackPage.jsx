import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthCard } from "../../components/auth/AuthCard";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { AuthMessage } from "../../components/auth/AuthMessage";
import { useAuth } from "../../features/auth/hooks/useAuth";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeGoogleLogin } = useAuth();
  const token = searchParams.get("token");
  const [error, setError] = useState(() =>
    token ? "" : "لم يرجع تسجيل الدخول عبر Google رمز وصول.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    completeGoogleLogin(token)
      .then((user) => {
        // Check if user has completed onboarding
        if (!user.onboardingCompleted) {
          navigate("/onboarding");
        } else {
          // Redirect based on role
          if (user.role === "HOST") {
            navigate("/owner");
          } else if (user.role === "GUEST") {
            navigate("/expatriate");
          } else {
            navigate("/");
          }
        }
      })
      .catch((caughtError) => setError(caughtError.message));
  }, [completeGoogleLogin, navigate, token]);

  return (
    <AuthLayout>
      <AuthCard
        title="جاري تسجيل الدخول"
        subtitle="نستكمل تسجيل الدخول عبر Google"
      >
        <div className="space-y-5 text-center">
          <AuthMessage>{error}</AuthMessage>
          {!error ? (
            <p className="text-sm font-semibold text-slate-500">
              انتظر قليلا أثناء ربط حسابك.
            </p>
          ) : (
            <Link to="/login" className="font-black text-[#075ed8]">
              العودة لتسجيل الدخول
            </Link>
          )}
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
