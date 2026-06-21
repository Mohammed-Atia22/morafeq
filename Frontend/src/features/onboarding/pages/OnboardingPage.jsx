import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { RoleCard } from "../components/RoleCard";
import { onboardingApi } from "../services/onboardingApi";
import toast from "react-hot-toast";
import logo from "../../../../images/logo.png";
import { getRoleHomePath } from "../../auth/utils/roleRedirect";

export function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { completeGoogleLogin, isAuthenticated, isUserLoading, user } = useAuth();

  const roles = [
    {
      id: "HOST",
      icon: "🏠",
      titleAr: "صاحب سكن",
      descriptionAr: "لدي شقة أريد تأجيرها",
    },
    {
      id: "GUEST",
      icon: "🎓",
      titleAr: "طالب مغترب",
      descriptionAr: "أبحث عن سكن للدراسة الجامعية",
    },
  ];

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        جاري تحميل بيانات المستخدم...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.onboardingCompleted) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error("يرجى اختيار نوع الحساب");
      return;
    }

    setIsLoading(true);
    try {
      const response = await onboardingApi.submitOnboarding(selectedRole);

      // Update auth context with new user data
      if (response.user && response.accessToken) {
        await completeGoogleLogin(response.accessToken);
      }

      // Redirect based on role
      if (selectedRole === "HOST") {
        navigate("/owner");
      } else {
        navigate("/expatriate");
      }

      toast.success("تم إكمال الاستكشاف بنجاح!");
    } catch (error) {
      toast.error(error.message || "حدث خطأ أثناء إكمال الاستكشاف");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-2xl">
        {/* Logo Section */}
        <div className="mb-8 flex flex-col items-center justify-center">
          <img src={logo} alt="مرافق" className="h-20 w-auto object-contain" />
        </div>

        {/* Main Card */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-slate-800">أنت...؟</h1>
            <p className="text-slate-600">اختر نوع حسابك للبحث</p>
          </div>

          {/* Role Cards */}
          <div className="mb-8 grid grid-cols-2 gap-4">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                icon={role.icon}
                title={role.titleAr}
                description={role.descriptionAr}
                isSelected={selectedRole === role.id}
                onClick={() => setSelectedRole(role.id)}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedRole || isLoading}
            className="w-full rounded-xl bg-blue-500 px-6 py-3 font-bold text-white transition-all duration-200 disabled:opacity-50 hover:bg-blue-600"
          >
            {isLoading ? "جاري المعالجة..." : "التالي"}
          </button>
        </div>
      </div>
    </div>
  );
}
