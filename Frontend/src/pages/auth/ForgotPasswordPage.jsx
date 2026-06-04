import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { AuthCard } from '../../components/auth/AuthCard'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthMessage } from '../../components/auth/AuthMessage'
import { FormField, inputClass } from '../../components/auth/FormField'
import { authApi } from '../../services/api'
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";



const schema = zod.object({
  email: zod
        .string()
        .trim()
        .toLowerCase()
        .nonempty("البريد الإلكتروني مطلوب")
        .email("أدخل بريد إلكتروني صحيح")
})

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (values) => {
    setServerError('')
    try {
      await authApi.forgotPassword(values)
      navigate(`/reset-password?email=${encodeURIComponent(values.email)}`)
    } catch (error) {
      setServerError(error.message)
    }
  }

  return (
    <AuthLayout>
      <AuthCard title="نسيت كلمة المرور" subtitle="سنرسل رمز إعادة التعيين إلى بريدك الإلكتروني">
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-xl bg-[#075ed8] text-base font-black text-white shadow-lg shadow-blue-700/25 transition hover:bg-[#0451bd] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'جاري إرسال الرمز...' : 'إرسال رمز التعيين'}
          </button>

          <Link to="/login" className="block text-center text-sm font-black text-[#075ed8]">
            العودة لتسجيل الدخول
          </Link>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
