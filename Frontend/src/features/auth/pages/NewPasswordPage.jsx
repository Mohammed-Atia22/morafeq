import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { AuthLayout } from "../components/AuthLayout";
import { AuthMessage } from "../components/AuthMessage";
import { FormField, inputClass } from "../components/FormField";
import { authApi } from "../services/authApi";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";

const passwordSchema = zod
  .object({
    newPassword: zod
      .string()
      .nonempty("كلمة المرور الجديدة مطلوبة")
      .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
        "استخدم حرف كبير وصغير ورقم ورمز",
      ),
    confirmPassword: zod.string().nonempty("تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export function NewPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");

  const resetSession = useMemo(() => {
    const stateEmail = location.state?.email;
    const stateOtp = location.state?.otp;
    const storedEmail = sessionStorage.getItem("morafeq_reset_email");
    const storedOtp = sessionStorage.getItem("morafeq_reset_otp");

    return {
      email: stateEmail || storedEmail || "",
      otp: stateOtp || storedOtp || "",
    };
  }, [location.state]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (!resetSession.email || !resetSession.otp) {
      navigate("/forgot-password", { replace: true });
    }
  }, [navigate, resetSession.email, resetSession.otp]);

  const onSubmit = async (values) => {
    setServerError("");

    try {
      await authApi.resetPassword({
        email: resetSession.email,
        otp: resetSession.otp,
        ...values,
      });

      sessionStorage.removeItem("morafeq_reset_email");
      sessionStorage.removeItem("morafeq_reset_otp");
      navigate("/login", { replace: true });
    } catch (error) {
      setServerError(error.message);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="إعادة تعيين كلمة المرور"
        subtitle="أدخل كلمة المرور الجديدة وأكدها"
      >
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <AuthMessage>{serverError}</AuthMessage>

          <FormField label="كلمة المرور الجديدة" error={errors.newPassword}>
            <input
              className={inputClass}
              type="password"
              placeholder="حرف كبير وصغير ورقم ورمز"
              {...register("newPassword")}
            />
          </FormField>

          <FormField label="تأكيد كلمة المرور" error={errors.confirmPassword}>
            <input
              className={inputClass}
              type="password"
              placeholder="أعد إدخال كلمة المرور"
              {...register("confirmPassword")}
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-xl bg-[#075ed8] text-base font-black text-white shadow-lg shadow-blue-700/25 transition hover:bg-[#0451bd] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "جاري التعيين..." : "تعيين كلمة المرور"}
          </button>

          <Link to="/login" className="block text-center text-sm font-black text-[#075ed8]">
            العودة لتسجيل الدخول
          </Link>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
