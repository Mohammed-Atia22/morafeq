import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { AuthLayout } from "../components/AuthLayout";
import { AuthMessage } from "../components/AuthMessage";
import { FormField, inputClass } from "../components/FormField";
import { GoogleButton } from "../components/GoogleButton";
import { authApi } from "../services/authApi";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";

const nameRegex =
  /^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u;

const registrationErrorMessages = {
  "This email is already registered": "هذا البريد الإلكتروني مسجل بالفعل",
  "This phone number is already registered": "رقم الهاتف مسجل بالفعل",
  "Invalid phone number": "ادخل رقم هاتف صحيح",
  "رقم الهاتف غير صحيح": "ادخل رقم هاتف صحيح",
  "ادخل رقم هاتف صحيح": "ادخل رقم هاتف صحيح",
  "Registration failed": "فشل إنشاء الحساب. حاول مرة أخرى.",
  "Please provide a valid email": "أدخل بريد إلكتروني صحيح",
  "Password is required": "كلمة المرور مطلوبة",
  "Password must be at least 8 characters": "كلمة المرور يجب ألا تقل عن 8 أحرف",
  "Password must not exceed 50 characters": "كلمة المرور يجب ألا تزيد عن 50 حرف",
  "Password must contain uppercase, lowercase, number, and symbol":
    "استخدم حرف كبير وصغير ورقم ورمز",
  "Confirm password is required": "تأكيد كلمة المرور مطلوب",
  "Passwords do not match": "كلمتا المرور غير متطابقتين",
  "First name is required": "الاسم الأول مطلوب",
  "First name must be at least 2 characters": "الاسم الأول يجب ألا يقل عن حرفين",
  "First name must not exceed 100 characters":
    "الاسم الأول يجب ألا يزيد عن 100 حرف",
  "First name must contain letters only and may include spaces, hyphens, or apostrophes":
    "الاسم الأول يجب أن يحتوي على حروف فقط",
  "Last name is required": "اسم العائلة مطلوب",
  "Last name must be at least 2 characters": "اسم العائلة يجب ألا يقل عن حرفين",
  "Last name must not exceed 100 characters":
    "اسم العائلة يجب ألا يزيد عن 100 حرف",
  "Last name must contain letters only and may include spaces, hyphens, or apostrophes":
    "اسم العائلة يجب أن يحتوي على حروف فقط",
  "Gender must be male or female": "اختر النوع",
  "Phone is required": "رقم الهاتف مطلوب",
  "Phone must not exceed 20 characters": "رقم الهاتف يجب ألا يزيد عن 20 رقم",
  "Phone must be in international format, e.g. +201001234567":
    "ادخل رقم هاتف صحيح",
};

const translateRegistrationError = (message) => {
  if (Array.isArray(message)) {
    return message.map(translateRegistrationError).join(", ");
  }

  return registrationErrorMessages[message] || message || "فشل إنشاء الحساب. حاول مرة أخرى.";
};

const getDialCode = (country) => `+${getCountryCallingCode(country)}`;

const getValidPhoneNumber = (country, localPhone) => {
  const digits = localPhone.trim();
  const phoneNumber = parsePhoneNumberFromString(digits, country);

  return phoneNumber?.isValid() ? phoneNumber : null;
};

const schema = zod
  .object({
    firstName: zod
      .string()
      .trim()
      .nonempty("الاسم الأول مطلوب")
      .min(2, "على الأقل حرفان")
      .max(30, "الاسم الأول لا يزيد عن 30 حرف")
      .regex(
    nameRegex,
    "الاسم الأول يجب أن يحتوي على حروف فقط",
  ),

    lastName: zod
      .string()
      .trim()
      .nonempty("اسم العائلة مطلوب")
      .min(2, "على الأقل حرفان")
      .max(30, "اسم العائلة لا يزيد عن 30 حرف")
       .regex(
    nameRegex,
    "اسم العائلة يجب أن يحتوي على حروف فقط",
  ),

    email: zod
      .string()
      .trim()
      .toLowerCase()
      .nonempty("البريد الإلكتروني مطلوب")
      .email("أدخل بريد إلكتروني صحيح"),

    countryCode: zod
      .string()
      .nonempty("كود الدولة مطلوب")
      .refine((country) => getCountries().includes(country), {
        message: "كود الدولة غير صحيح",
      }),

    phoneNumber: zod
      .string()
      .trim()
      .nonempty("رقم الهاتف مطلوب")
      .regex(/^\d+$/, "رقم الهاتف يجب أن يحتوي على أرقام فقط")
      .min(7, "ادخل رقم هاتف صحيح")
      .max(14, "ادخل رقم هاتف صحيح"),

    gender: zod.enum(["male", "female"], {
      message: "اختر النوع",
    }),

    password: zod
      .string()
      .nonempty("كلمة المرور مطلوبة")
      .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
        "استخدم حرف كبير وصغير ورقم ورمز",
      ),

    confirmPassword: zod.string().nonempty("تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    if (
      data.countryCode &&
      getCountries().includes(data.countryCode) &&
      /^\d{7,14}$/.test(data.phoneNumber) &&
      !getValidPhoneNumber(data.countryCode, data.phoneNumber)
    ) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: "ادخل رقم هاتف صحيح",
        path: ["phoneNumber"],
      });
    }
  });

export function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { countryCode: "EG", gender: "male" },
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(schema),
  });

  const regionNames = new Intl.DisplayNames(["ar"], { type: "region" });

  const countryCodes = getCountries()
    .map((country) => ({
      country,
      name: regionNames.of(country) || country,
      code: getDialCode(country),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));

  const onSubmit = async (values) => {
    setServerError("");
    try {
      const phoneNumber = getValidPhoneNumber(
        values.countryCode,
        values.phoneNumber,
      );

      const payload = {
        ...values,
        phone: phoneNumber.number,
      };

      delete payload.countryCode;
      delete payload.phoneNumber;

      await authApi.register(payload);
      toast.success("تم التسجيل بنجاح");
      navigate(`/confirm-otp?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      console.log(error.response?.data || error.message);
      setServerError(translateRegistrationError(error.response?.data?.message || error.message));
    }
  };

  return (
    <AuthLayout>
      <AuthCard
        title="إنشاء حساب جديد"
        subtitle="انضم إلى سكن وفعّل بريدك الإلكتروني"
        activeTab="register"
        footer={
          <>
            لديك حساب بالفعل؟{" "}
            <Link className="font-black text-[#075ed8]" to="/login">
              تسجيل الدخول
            </Link>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <AuthMessage>{serverError}</AuthMessage>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="الاسم الأول" error={errors.firstName}>
              <input
                className={inputClass}
                placeholder="أحمد"
                {...register("firstName", {
                  required: "الاسم الأول مطلوب",
                  minLength: { value: 2, message: "على الأقل حرفان" },
                })}
              />
            </FormField>
            <FormField label="اسم العائلة" error={errors.lastName}>
              <input
                className={inputClass}
                placeholder="حسن"
                {...register("lastName")}
              />
            </FormField>
          </div>

          <FormField label="البريد الإلكتروني" error={errors.email}>
            <input
              className={inputClass}
              type="email"
              placeholder="example@email.com"
              {...register("email")}
            />
          </FormField>

          <FormField
            label="رقم الهاتف"
            error={errors.countryCode || errors.phoneNumber}
          >
            <div className="flex gap-2">
              <select
                className={`${inputClass} w-40`}
                dir="ltr"
                {...register("countryCode", {
                  // required: "كود الدولة مطلوب",
                })}
              >
                <option value="">Code</option>

                {countryCodes.map((item) => (
                  <option key={item.country} value={item.country}>
                    {item.name} {item.code}
                  </option>
                ))}
              </select>

              <input
                className={inputClass}
                type="tel"
                inputMode="numeric"
                dir="ltr"
                placeholder="1001234567"
                {...register("phoneNumber", {
                  onChange: (event) => {
                    event.target.value = event.target.value.replace(/\D/g, "");
                  },
                })}
              />
            </div>
          </FormField>

          <FormField label="النوع" error={errors.gender}>
            <select className={inputClass} {...register("gender")}>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </FormField>

          <FormField label="كلمة المرور" error={errors.password}>
            <input
              className={inputClass}
              type="password"
              placeholder="حرف كبير وصغير ورقم ورمز"
              {...register("password")}
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
            {isSubmitting ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
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
