import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { AuthLayout } from "../components/AuthLayout";
import { AuthMessage } from "../components/AuthMessage";
import { FormField, inputClass } from "../components/FormField";
import { authApi } from "../services/authApi";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: searchParams.get("email") || "" },
  });

  const onSubmit = async (values) => {
    setServerError("");
    try {
      await authApi.resetPassword(values);
      navigate("/login");
    } catch (error) {
      setServerError(error.message);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="إعادة تعيين كلمة المرور"
        subtitle="استخدم رمز التحقق لإنشاء كلمة مرور جديدة"
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <AuthMessage>{serverError}</AuthMessage>

          <FormField label="البريد الإلكتروني" error={errors.email}>
            <input
              className={inputClass}
              type="email"
              {...register("email", { required: "البريد الإلكتروني مطلوب" })}
            />
          </FormField>

          <FormField label="رمز التحقق" error={errors.otp}>
            <input
              className={`${inputClass} text-center text-lg tracking-[0.4em]`}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              {...register("otp", {
                required: "رمز التحقق مطلوب",
                pattern: {
                  value: /^\d{6}$/,
                  message: "رمز التحقق يجب أن يكون 6 أرقام",
                },
              })}
            />
          </FormField>

          <FormField label="كلمة المرور الجديدة" error={errors.newPassword}>
            <input
              className={inputClass}
              type="password"
              {...register("newPassword", {
                required: "كلمة المرور الجديدة مطلوبة",
                minLength: { value: 8, message: "على الأقل 8 أحرف" },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
                  message: "استخدم حرف كبير وصغير ورقم ورمز",
                },
              })}
            />
          </FormField>

          <FormField label="تأكيد كلمة المرور" error={errors.confirmPassword}>
            <input
              className={inputClass}
              type="password"
              {...register("confirmPassword", {
                required: "تأكيد كلمة المرور مطلوب",
                validate: (value) =>
                  value === getValues("newPassword") ||
                  "كلمتا المرور غير متطابقتين",
              })}
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-xl bg-[#075ed8] text-base font-black text-white shadow-lg shadow-blue-700/25 transition hover:bg-[#0451bd] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "جاري التعيين..." : "تعيين كلمة المرور"}
          </button>

          <Link
            to="/login"
            className="block text-center text-sm font-black text-[#075ed8]"
          >
            العودة لتسجيل الدخول
          </Link>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
