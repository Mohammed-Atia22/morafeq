import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { AuthCard } from '../../components/auth/AuthCard'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthMessage } from '../../components/auth/AuthMessage'
import { FormField, inputClass } from '../../components/auth/FormField'
import { GoogleButton } from '../../components/auth/GoogleButton'
import { authApi } from '../../services/api'

export function RegisterPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { gender: 'male' } })

  const onSubmit = async (values) => {
    setServerError('')
    try {
      await authApi.register(values)
      navigate(`/confirm-otp?email=${encodeURIComponent(values.email)}`)
    } catch (error) {
      setServerError(error.message)
    }
  }

  return (
    <AuthLayout>
      <AuthCard
        title="إنشاء حساب جديد"
        subtitle="انضم إلى سكن وفعّل بريدك الإلكتروني"
        activeTab="register"
        footer={
          <>
            لديك حساب بالفعل؟{' '}
            <Link className="font-black text-[#075ed8]" to="/login">
              تسجيل الدخول
            </Link>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <AuthMessage>{serverError}</AuthMessage>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="الاسم الأول" error={errors.firstName}>
              <input
                className={inputClass}
                placeholder="أحمد"
                {...register('firstName', {
                  required: 'الاسم الأول مطلوب',
                  minLength: { value: 2, message: 'على الأقل حرفان' },
                })}
              />
            </FormField>
            <FormField label="اسم العائلة" error={errors.lastName}>
              <input
                className={inputClass}
                placeholder="حسن"
                {...register('lastName', {
                  required: 'اسم العائلة مطلوب',
                  minLength: { value: 2, message: 'على الأقل حرفان' },
                })}
              />
            </FormField>
          </div>

          <FormField label="البريد الإلكتروني" error={errors.email}>
            <input
              className={inputClass}
              type="email"
              placeholder="example@email.com"
              {...register('email', {
                required: 'البريد الإلكتروني مطلوب',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'أدخل بريد إلكتروني صحيح',
                },
              })}
            />
          </FormField>

          <FormField label="رقم الهاتف" error={errors.phone}>
            <input
              className={inputClass}
              placeholder="+201001234567"
              {...register('phone', {
                required: 'رقم الهاتف مطلوب',
                pattern: {
                  value: /^\+[1-9]\d{7,14}$/,
                  message: 'استخدم الصيغة الدولية مثل +201001234567',
                },
              })}
            />
          </FormField>

          <FormField label="النوع" error={errors.gender}>
            <select className={inputClass} {...register('gender')}>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </FormField>

          <FormField label="كلمة المرور" error={errors.password}>
            <input
              className={inputClass}
              type="password"
              placeholder="حرف كبير وصغير ورقم ورمز"
              {...register('password', {
                required: 'كلمة المرور مطلوبة',
                minLength: { value: 8, message: 'على الأقل 8 أحرف' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
                  message: 'استخدم حرف كبير وصغير ورقم ورمز',
                },
              })}
            />
          </FormField>

          <FormField label="تأكيد كلمة المرور" error={errors.confirmPassword}>
            <input
              className={inputClass}
              type="password"
              placeholder="أعد إدخال كلمة المرور"
              {...register('confirmPassword', {
                required: 'تأكيد كلمة المرور مطلوب',
                validate: (value) =>
                  value === getValues('password') || 'كلمتا المرور غير متطابقتين',
              })}
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-xl bg-[#075ed8] text-base font-black text-white shadow-lg shadow-blue-700/25 transition hover:bg-[#0451bd] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
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
  )
}
