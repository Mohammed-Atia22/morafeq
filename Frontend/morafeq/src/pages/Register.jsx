// src/pages/Register.jsx
// --------------------------------------------------
// Register page — wired to useAuth hook.
// Handles: full name, email, phone, password, role selection.
// --------------------------------------------------

import { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ROLES = [
  {
    value: "tenant",
    label: "طالب / مستأجر",
    description: "أبحث عن سكن",
    icon: "🎓",
  },
  {
    value: "owner",
    label: "مالك عقار",
    description: "أريد تأجير عقاري",
    icon: "🏠",
  },
];

const Register = () => {
  const { register, loading, error, fields } = useAuth();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "tenant",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleSelect = (role) => {
    setForm((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(form);
    // navigation is handled inside useAuth on success
  };

  // Helper: show field-level error if backend returns one
  const fieldError = (name) =>
    fields?.[name] ? (
      <p className="text-red-500 text-xs font-semibold mt-1 text-right">{fields[name]}</p>
    ) : null;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-card-lg p-8 border border-gray-100">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <span className="text-white font-black text-xl">م</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">إنشاء حساب مجاني</h1>
            <p className="text-gray-400 text-sm font-medium">انضم لآلاف الطلاب على مرافق</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => handleRoleSelect(role.value)}
                className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all duration-150 ${
                  form.role === role.value
                    ? "border-primary-500 bg-primary-50 shadow-sm shadow-blue-100"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span className="text-2xl">{role.icon}</span>
                <span className={`font-bold text-sm ${form.role === role.value ? "text-primary-700" : "text-gray-700"}`}>
                  {role.label}
                </span>
                <span className="text-gray-400 text-xs">{role.description}</span>
              </button>
            ))}
          </div>

          {/* Global error */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl mb-6 text-right flex items-center gap-2 flex-row-reverse">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Full name */}
            <div>
              <label className="block text-right text-sm font-bold text-gray-700 mb-2">
                الاسم الكامل
              </label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="أحمد محمد"
                required
                disabled={loading}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all disabled:opacity-50 disabled:bg-gray-50"
              />
              {fieldError("full_name")}
            </div>

            {/* Email */}
            <div>
              <label className="block text-right text-sm font-bold text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@email.com"
                required
                disabled={loading}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all disabled:opacity-50 disabled:bg-gray-50"
              />
              {fieldError("email")}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-right text-sm font-bold text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="01xxxxxxxxx"
                required
                disabled={loading}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all disabled:opacity-50 disabled:bg-gray-50"
              />
              {fieldError("phone")}
            </div>

            {/* Password */}
            <div>
              <label className="block text-right text-sm font-bold text-gray-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="8 أحرف على الأقل"
                  required
                  disabled={loading}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-11 text-right text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all disabled:opacity-50 disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Password strength hint */}
              {form.password.length > 0 && form.password.length < 8 && (
                <p className="text-amber-500 text-xs font-semibold mt-1 text-right">
                  كلمة المرور قصيرة جداً
                </p>
              )}
              {fieldError("password")}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !form.full_name || !form.email || !form.phone || form.password.length < 8}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-2 text-base mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جارٍ إنشاء الحساب...
                </>
              ) : (
                "إنشاء الحساب مجاناً"
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-gray-300 text-xs font-medium">أو</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Google */}
          <button
            type="button"
            disabled={loading}
            className="w-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-3 text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            التسجيل بحساب Google
          </button>

          {/* Login link */}
          <p className="text-center text-sm text-gray-400 font-medium mt-6">
            لديك حساب بالفعل؟{" "}
            <Link to="/login" className="text-primary-600 font-bold hover:text-primary-800 transition-colors">
              سجّل دخولك
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Register;