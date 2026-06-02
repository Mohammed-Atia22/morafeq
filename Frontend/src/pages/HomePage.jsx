import heroImage from '../assets/hero.png'
import { AppNavbar } from '../components/layout/AppNavbar'

export function HomePage() {
  return (
    <main className="min-h-screen bg-[#0e2a45] text-white" dir="rtl">
      <AppNavbar />
      <section className="relative flex min-h-screen items-center overflow-hidden px-5 pt-20">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-45 blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#12375b]/85 via-[#12375b]/70 to-black/65" />
        <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-100">
            منصة السكن الطلابي
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
            أهلا بك في سكن
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-8 text-slate-200 sm:text-lg">
            هذه الصفحة جاهزة كبداية للمشروع، ويمكنك بناء باقي المنصة هنا بعد
            الانتهاء من جزء تسجيل الدخول وإنشاء الحساب.
          </p>
        </div>
      </section>
    </main>
  )
}
