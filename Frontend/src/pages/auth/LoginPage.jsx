import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { AuthCard } from '../../components/auth/AuthCard'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthMessage } from '../../components/auth/AuthMessage'
import { FormField, inputClass } from '../../components/auth/FormField'
import { GoogleButton } from '../../components/auth/GoogleButton'
import { useAuth } from '../../hooks/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (values) => {
    setServerError('')
    try {
      await login(values)
      navigate('/')
    } catch (error) {
      setServerError(error.message)
    }
  }

  return (
    <AuthLayout>
      <AuthCard
        title="أهلا بك في سكن"
        subtitle="منصة السكن الطلابي الأولى في مصر"
        activeTab="login"
        footer={
          <>
            ليس لديك حساب؟{' '}
            <Link className="font-black text-[#075ed8]" to="/register">
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
              {...register('email', {
                required: 'البريد الإلكتروني مطلوب',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'أدخل بريد إلكتروني صحيح',
                },
              })}
            />
          </FormField>

          <FormField label="كلمة المرور" error={errors.password}>
            <input
              className={inputClass}
              type="password"
              placeholder="أدخل كلمة المرور"
              {...register('password', { required: 'كلمة المرور مطلوبة' })}
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
            {isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
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
