import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { RoleCard } from "../components/RoleCard";
import { onboardingApi } from "../services/onboardingApi";
import toast from "react-hot-toast";
import { getRoleHomePath } from "../../auth/utils/roleRedirect";

export function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { completeGoogleLogin, isAuthenticated, isUserLoading, user } = useAuth();

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

  const handleRoleSelect = async (role) => {
    setIsLoading(true);
    try {
      const response = await onboardingApi.submitOnboarding(role);

      if (response.user && response.accessToken) {
        await completeGoogleLogin(response.accessToken);
      }

      navigate(role === "HOST" ? "/owner" : "/expatriate");
      toast.success("تم إكمال الاستكشاف بنجاح!");
    } catch (error) {
      toast.error(error.message || "حدث خطأ أثناء إكمال الاستكشاف");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Step indicator */}
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-white px-4 py-1.5 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-slate-500">
              الخطوة 1 من 3 – اختر نوع حسابك
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-3xl font-bold text-slate-800">
            كيف تريد استخدام <span className="text-blue-600">مرافق</span>؟
          </h1>
          <p className="text-sm text-slate-400">
            اختر نوع حسابك وسنخصص تجربتك بالكامل لاحتياجاتك
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <RoleCard
            variant="blue"
            badgeEmoji="🎓"
            floatingEmojis={[
              { icon: "📚", position: { top: "1.5rem", left: "2.5rem" } },
              { icon: "🧑‍🎓", position: { top: "2.25rem", right: "2.5rem" } },
              { icon: "🛡️", position: { bottom: "1.75rem", left: "5rem" } },
            ]}
            title="أنا طالب / مغترب"
            description="ابحث عن سكنك المثالي بالقرب من جامعتك بأسعار تناسب ميزانيتك"
            features={[
              "ابحث عن شقق وغرف موثقة بالقرب من جامعتك",
              "تواصل مع ملاك العقارات مباشرة",
              "اطلع على ملخص العقد بالذكاء الاصطناعي",
              "اعثر على زملاء سكن بنظام مطابقة ذكي",
              "ادفع بأمان وتتبع فواتيرك",
            ]}
            buttonLabel="أنا طالب أبحث عن سكن"
            onClick={() => handleRoleSelect("GUEST")}
          />

          <RoleCard
            variant="green"
            badgeEmoji="🏗️"
            floatingEmojis={[
              { icon: "📊", position: { top: "1.5rem", left: "2.5rem" } },
              { icon: "🔑", position: { top: "2.25rem", right: "2.5rem" } },
              { icon: "💰", position: { bottom: "1.75rem", left: "5rem" } },
            ]}
            title="أنا صاحب سكن"
            description="أضف عقاراتك وتواصل مع الطلاب المغتربين بكل أمان وسهولة"
            features={[
              "أضف وأدر عقاراتك بسهولة تامة",
              "تلقَّ طلبات المعاينة وتحكم بها",
              "وثِّق عقودك الإلكترونية موثقة",
              "تتبع نسب الإشغال وإيراداتك",
              "تواصل مع الطلاب المغتربين مباشرة",
            ]}
            buttonLabel="لدي عقار للإيجار"
            onClick={() => handleRoleSelect("HOST")}
          />
        </div>

        {isLoading && (
          <p className="mt-6 text-center text-sm text-slate-400">جاري المعالجة...</p>
        )}
      </div>
    </div>
  );
}