import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { AuthMessage } from "../components/AuthMessage";
import { OtpInput } from "../components/OtpInput";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../services/authApi";
import { getRoleHomePath } from "../utils/roleRedirect";
import toast from "react-hot-toast";
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
    .min(6, "رمز التحقق يجب الا يقل عن 6 أرقام")
    .max(6, "رمز التحقق يجب الا يزيد عن  6 أرقام")
    .regex(/^\d{6}$/, "رمز التحقق يجب أن يكون 6 أرقام"),
});

const RESEND_LIMIT_MESSAGE = "انتظر دقيقة واحدة قبل طلب الرمز.";

const maskEmail = (email) => {
  if (!email || !email.includes("@")) return "بريدك الإلكتروني";

  const [name, domain] = email.split("@");
  const visibleName =
    name.length <= 2 ? name[0] || "" : `${name.slice(0, 2)}${"*".repeat(Math.min(name.length - 2, 5))}`;

  return `${visibleName}@${domain}`;
};

function EmailCodeIcon() {
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#176adf] text-white shadow-lg shadow-blue-500/20">
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v12H4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m4 8 8 5 8-5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16h.01M12 16h.01M16 16h.01" />
      </svg>
    </div>
  );
}

export function ConfirmOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { confirmOtp } = useAuth();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const {
    register,
    handleSubmit,
    getValues,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: searchParams.get("email") || "", otp: "" },
    resolver: zodResolver(schema)
  });
  const otpValue = watch("otp");
  const emailValue = watch("email");
  const isOtpComplete = /^\d{6}$/.test(otpValue || "");

  useEffect(() => {
    if (resendSecondsLeft <= 0) return undefined;

    const timeoutId = window.setTimeout(() => {
      setResendSecondsLeft((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [resendSecondsLeft]);

  const onSubmit = async (values) => {
    setServerError("");
    setSuccess("");
    try {
      const res = await confirmOtp(values);

      if (res && res.user) {
        toast.success("تم التحقق بنجاح");

        // Check if user has completed onboarding
        if (!res.user.onboardingCompleted) {
          navigate("/onboarding");
        } else {
          navigate(getRoleHomePath(res.user.role), { replace: true });
        }
      }
    } catch (error) {
      setServerError(error.message);
    }
  };

  const resend = async () => {
    if (resendSecondsLeft > 0) return;

    setServerError("");
    setSuccess("");
    try {
      await authApi.resendOtp({ email: getValues("email") });
      setSuccess("تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.");
      setResendSecondsLeft(60);
    } catch (error) {
      setServerError(error.message);
      if (error.message === RESEND_LIMIT_MESSAGE) {
        setResendSecondsLeft(60);
      }
    }
  };

  return (
    <AuthLayout>
      <section className="w-full max-w-[452px] overflow-hidden rounded-[24px] bg-white shadow-2xl shadow-black/20">
        <div className="flex items-center justify-end gap-4 bg-[#eef6ff] px-6 py-6 sm:px-8">
          <div className="text-right">
            <h1 className="text-xl font-black text-[#111827]">التحقق من البريد الإلكتروني</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              أرسلنا الرمز إلى {maskEmail(emailValue)}
            </p>
          </div>
          <EmailCodeIcon />
        </div>

        <form className="space-y-6 px-6 py-8 sm:px-8" onSubmit={handleSubmit(onSubmit)} noValidate>
          <AuthMessage>{serverError}</AuthMessage>
          <AuthMessage>{errors.email?.message || errors.otp?.message}</AuthMessage>
          <AuthMessage type="success">{success}</AuthMessage>

          <input type="hidden" {...register("email")} />
          <input type="hidden" {...register("otp")} />

          <div>
            <label className="sr-only">رمز التحقق</label>
            <OtpInput
              value={otpValue}
              disabled={isSubmitting}
              onChange={(value) => setValue("otp", value, { shouldValidate: true })}
              onBlur={() => trigger("otp")}
            />
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center">
            <p className="text-sm font-semibold text-slate-500">
              تم إرسال الرمز إلى {maskEmail(emailValue)}
            </p>
            <button
              type="button"
              onClick={resend}
              disabled={resendSecondsLeft > 0}
              className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-black text-[#075ed8] transition disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
              </svg>
              {resendSecondsLeft > 0
                ? `إعادة إرسال الرمز خلال ${resendSecondsLeft} ثانية`
                : "إعادة إرسال الرمز"}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isOtpComplete}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#075ed8] text-base font-black text-white shadow-lg shadow-blue-700/25 transition hover:bg-[#0451bd] disabled:cursor-not-allowed disabled:bg-[#c8ceda] disabled:text-white disabled:shadow-none"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {isSubmitting ? "جاري التأكيد..." : "تأكيد الرمز"}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4 text-sm sm:px-8">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-black text-slate-700 shadow-sm transition hover:border-[#075ed8] hover:text-[#075ed8]"
          >
            الخطوة السابقة
            <svg className="h-4 w-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <Link to="/login" className="font-black text-[#075ed8]">
            تسجيل الدخول
          </Link>
        </div>
      </section>
    </AuthLayout>
  );
}
