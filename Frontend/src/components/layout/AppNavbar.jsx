import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navLinkClass = ({ isActive }) =>
  [
    'text-sm font-semibold transition hover:text-white',
    isActive ? 'text-white' : 'text-slate-300',
  ].join(' ')

export function AppNavbar() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[#102b4a]/95 backdrop-blur">
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-lg font-black text-[#075ed8]">
            M
          </span>
          <span className="text-xl font-black">سكن</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <NavLink to="/" className={navLinkClass}>
            الرئيسية
          </NavLink>
          <a href="#listings" className="text-sm font-semibold text-slate-300">
            استعراض العقارات
          </a>
          <a href="#how-it-works" className="text-sm font-semibold text-slate-300">
            كيف يعمل
          </a>
          <a href="#contact" className="text-sm font-semibold text-slate-300">
            تواصل معنا
          </a>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm font-semibold text-slate-200 sm:block">
                {user?.firstName ? `مرحبا، ${user.firstName}` : 'مرحبا بك'}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
              >
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                تسجيل الدخول
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#075ed8] shadow-sm transition hover:bg-slate-100"
              >
                إنشاء حساب
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
