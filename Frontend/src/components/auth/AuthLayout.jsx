import heroImage from '../../assets/hero.png'
import { AppNavbar } from '../layout/AppNavbar'

export function AuthLayout({ children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0e2a45]" dir="rtl">
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 h-full w-full scale-105 object-cover opacity-55 blur-sm"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f3154]/85 via-[#12375b]/75 to-black/70" />
      <AppNavbar />
      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-28 sm:px-6">
        {children}
      </section>
    </main>
  )
}
