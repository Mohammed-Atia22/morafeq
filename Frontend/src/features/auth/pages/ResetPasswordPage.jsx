import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { AuthLayout } from "../components/AuthLayout";
import { AuthMessage } from "../components/AuthMessage";
import { FormField } from "../components/FormField";
import { OtpInput } from "../components/OtpInput";
import { authApi } from "../services/authApi";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";

const schema = zod.object({
  email: zod
    .string()
    .trim()
    .toLowerCase()
    .nonempty("البريد الإلكتروني مطلوب")
    .email("أدخل بريد إلكتروني صحيح"),
  otp: zod
    .string()
    .nonempty("رمز التحقق مطلوب")
    .regex(/^\d{6}$/, "رمز التحقق يجب أن يكون 6 أرقام"),
});

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: searchParams.get("email") || "", otp: "" },
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    setServerError("");
    setSuccess("");

    try {
      await authApi.verifyResetOtp(values);
      sessionStorage.setItem("morafeq_reset_email", values.email);
      sessionStorage.setItem("morafeq_reset_otp", values.otp);
      navigate("/reset-password/new", {
        replace: true,
        state: { email: values.email, otp: values.otp },
      });
    } catch (error) {
      setServerError(error.message);
    }
  };

  const resend = async () => {
    const email = getValues("email");

    setServerError("");
    setSuccess("");

    if (!email) {
      setServerError("البريد الإلكتروني مطلوب لإعادة إرسال الرمز");
      return;
    }

    try {
      await authApi.forgotPassword({ email });
      setSuccess("تم إرسال رمز جديد إلى بريدك الإلكتروني.");
    } catch (error) {
      setServerError(error.message);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="إعادة تعيين كلمة المرور"
        subtitle="أدخل رمز التحقق المرسل إلى بريدك الإلكتروني"
      >
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <AuthMessage>{serverError}</AuthMessage>
          <AuthMessage>{errors.email?.message}</AuthMessage>
          <AuthMessage type="success">{success}</AuthMessage>

          <input type="hidden" {...register("email")} />
          <input type="hidden" {...register("otp")} />

          <FormField label="رمز التحقق" error={errors.otp}>
            <OtpInput
              value={watch("otp")}
              disabled={isSubmitting}
              onChange={(value) => setValue("otp", value, { shouldValidate: true })}
              onBlur={() => trigger("otp")}
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-xl bg-[#075ed8] text-base font-black text-white shadow-lg shadow-blue-700/25 transition hover:bg-[#0451bd] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "جاري التحقق..." : "تأكيد الرمز"}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <button type="button" onClick={resend} className="font-black text-[#075ed8]">
              إعادة إرسال الرمز
            </button>
            <Link to="/forgot-password" className="font-black text-slate-500">
              تغيير البريد الإلكتروني
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
