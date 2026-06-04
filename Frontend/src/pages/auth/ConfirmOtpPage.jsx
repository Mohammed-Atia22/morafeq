import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthCard } from '../../components/auth/AuthCard'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthMessage } from '../../components/auth/AuthMessage'
import { FormField, inputClass } from '../../components/auth/FormField'
import { useAuth } from '../../hooks/useAuth'
import { authApi } from '../../services/api'
import axios from 'axios'
import toast from 'react-hot-toast'
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
              .min(6, 'رمز التحقق يجب الا يقل عن 6 أرقام')
              .max(6,'رمز التحقق يجب الا يزيد عن  6 أرقام')
              .regex(
                /^\d{6}$/,
                'رمز التحقق يجب أن يكون 6 أرقام',
              )
})

export function ConfirmOtpPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { confirmOtp } = useAuth()
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState('')
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: searchParams.get('email') || '', otp: '' },
  })

  const onSubmit = async (values) => {
    setServerError('')
    setSuccess('')
    try {
      // await confirmOtp(values)
      const res = await axios.patch(
      "http://localhost:3001/api/v1/auth/confirm",
      values
    );

    console.log(res);

    if(res.status== 200){
      toast.success("otp صحيح")
      navigate('/')
    }else{
      console.log(res.data.data);
      
    }
    
    } catch (error) {
      setServerError(error.message)
    }
  }

  const resend = async () => {
    setServerError('')
    setSuccess('')
    try {
      await authApi.resendOtp({ email: getValues('email') })
      setSuccess('تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.')
    } catch (error) {
      setServerError(error.message)
    }
  }

  return (
    <AuthLayout>
      <AuthCard title="تأكيد البريد الإلكتروني" subtitle="أدخل رمز التحقق المكون من 6 أرقام">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <AuthMessage>{serverError}</AuthMessage>
          <AuthMessage type="success">{success}</AuthMessage>

          <FormField label="البريد الإلكتروني" error={errors.email}>
            <input
              className={inputClass}
              type="email"
              {...register('email', { required: 'البريد الإلكتروني مطلوب' })}
            />
          </FormField>

          <FormField label="رمز التحقق" error={errors.otp}>
            <input
              className={`${inputClass} text-center text-lg tracking-[0.4em]`}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              {...register('otp')}
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-xl bg-[#075ed8] text-base font-black text-white shadow-lg shadow-blue-700/25 transition hover:bg-[#0451bd] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'جاري التأكيد...' : 'تأكيد البريد'}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={resend} className="font-black text-[#075ed8]">
              إعادة إرسال الرمز
            </button>
            <Link to="/login" className="font-black text-slate-500">
              العودة لتسجيل الدخول
            </Link>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
