import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { AuthLayout } from "../components/AuthLayout";
import { AuthMessage } from "../components/AuthMessage";
import { FormField, inputClass } from "../components/FormField";
import { GoogleButton } from "../components/GoogleButton";
import { useAuth } from "../hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";

const LOGIN_ERROR_MESSAGE =
  "يرجى التحقق من كلمة المرور والبريد الإلكتروني والمحاولة مرة أخرى.";

const schema = zod.object({
  email: zod
    .string()
    .trim()
    .toLowerCase()
    .nonempty("البريد الإلكتروني مطلوب")
    .email("أدخل بريد إلكتروني صحيح"),

  password: zod
    .string()
    .nonempty("كلمة المرور مطلوبة")
    .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
      "استخدم حرف كبير وصغير ورقم ورمز",
    ),
});
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState("");
  const redirectPath = location.state?.from?.pathname || null;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    setServerError("");
    try {
      const data = await login(values);
      console.log(data);
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else if(data.user.role == "HOST"){
        navigate("/owner");
      }else{
        navigate("/");
        
      }
    } catch (error) {
      setServerError(LOGIN_ERROR_MESSAGE);
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="أهلا بك في سكن"
        subtitle="منصة السكن الطلابي الأولى في مصر"
        activeTab="login"
        footer={
          <>
            ليس لديك حساب؟{" "}
            <Link className="font-black text-[#075ed8]" to="/register" state={location.state}>
              إنشاء حساب جديد
            </Link>
          </>
        }
      >
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <AuthMessage>{serverError}</AuthMessage>

          <FormField label="البريد الإلكتروني" error={errors.email}>
            <input
              className={inputClass}
              type="email"
              placeholder="example@email.com"
              {...register("email")}
            />
          </FormField>

          <FormField label="كلمة المرور" error={errors.password}>
            <input
              className={inputClass}
              type="password"
              placeholder="أدخل كلمة المرور"
              {...register("password")}
            />
          </FormField>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 font-semibold text-slate-500">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#075ed8]"
              />
              تذكرني
            </label>
            <Link className="font-black text-[#075ed8]" to="/forgot-password">
              نسيت كلمة المرور؟
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-xl bg-[#075ed8] text-base font-black text-white shadow-lg shadow-blue-700/25 transition hover:bg-[#0451bd] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            أو المتابعة عبر
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <GoogleButton />
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
